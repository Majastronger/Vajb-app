import Anthropic from 'npm:@anthropic-ai/sdk@0.129.0';
import { GoogleGenAI, Modality } from 'npm:@google/genai@2.25.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  ASPECT,
  buildDailyPrompt,
  buildEditPrompt,
  buildImagePrompt,
  buildPrompt,
  DAILY_SCHEMA,
  IMAGE_PROMPT_SCHEMA,
  LANGS,
  OUTPUT_SCHEMA,
  parseRequest,
  SYSTEM,
  type Lang,
  type TextMode,
} from './prompts.ts';
import { MSG } from './messages.ts';

// Daily limits per kind. null = unlimited.
const LIMITS = {
  text: { free: 5, premium: null },
  image: { free: 1, premium: 20 },
} as const;
type Kind = keyof typeof LIMITS;

// Budget caps for free users, across everyone, per day. Premium users are not counted against them.
const DAILY_FREE_CAP: Record<Kind, number> = {
  text: Number(Deno.env.get('DAILY_TEXT_CAP') ?? 150),
  image: Number(Deno.env.get('DAILY_IMAGE_CAP') ?? 8),
};

const MODEL = Deno.env.get('CLAUDE_MODEL') ?? 'claude-haiku-4-5';
// Haiku 4.5 takes neither effort nor server-side fallbacks.
const IS_HAIKU = MODEL.startsWith('claude-haiku');
const IMAGE_MODEL = Deno.env.get('IMAGE_MODEL') ?? 'gemini-2.5-flash-image';
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type ImageType = (typeof IMAGE_TYPES)[number];
const MAX_IMAGE_BASE64 = 5_000_000;

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
const fail = (status: number, code: string, message: string, extra: object = {}) =>
  reply(status, { code, message, ...extra });

class Refused extends Error {}

// Daily inspiration: made once per day and language, then served from the table to everyone.
// It does not use anyone's credits.
async function daily(lang: Lang) {
  const now = new Date();
  const day = now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zagreb' });
  const { data: row } = await admin.from('daily_content').select('content').eq('day', day).eq('lang', lang).maybeSingle();
  if (row) return row.content;
  const weekday = now.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Europe/Zagreb' });
  const content = await askClaude(SYSTEM, [{ type: 'text', text: buildDailyPrompt(lang, day, weekday) }], DAILY_SCHEMA);
  await admin.from('daily_content').upsert({ day, lang, content }, { onConflict: 'day,lang', ignoreDuplicates: true });
  return content;
}

async function drawImage(contents: unknown, aspectRatio?: string) {
  const googleKey = Deno.env.get('GOOGLE_API_KEY');
  if (!googleKey) throw new Error('GOOGLE_API_KEY is not set');
  const result = await new GoogleGenAI({ apiKey: googleKey }).models.generateContent({
    model: IMAGE_MODEL,
    // deno-lint-ignore no-explicit-any
    contents: contents as any,
    config: {
      responseModalities: [Modality.IMAGE],
      ...(aspectRatio ? { imageConfig: { aspectRatio } } : {}),
    },
  });
  const image = result.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
  if (!image?.data) {
    console.error('no image returned', result.candidates?.[0]?.finishReason, result.promptFeedback?.blockReason);
    throw new Refused();
  }
  return { image: image.data, mimeType: image.mimeType ?? 'image/png' };
}

async function askClaude(
  system: string,
  content: Anthropic.Beta.BetaContentBlockParam[],
  schema: Record<string, unknown>,
): Promise<unknown> {
  const response = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system,
    ...(IS_HAIKU
      ? { output_config: { format: { type: 'json_schema', schema } } }
      : {
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default' as const,
          output_config: { effort: 'low' as const, format: { type: 'json_schema' as const, schema } },
        }),
    messages: [{ role: 'user', content }],
  });
  if (response.stop_reason === 'refusal') throw new Refused();
  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  return JSON.parse(text);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return fail(405, 'method', 'Samo POST.');

  const body = await req.json().catch(() => null);
  const m = MSG[LANGS.find((l) => l === (body as { lang?: unknown } | null)?.lang) ?? 'hr'];

  // Who is asking (anonymous Supabase user).
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const { data: auth } = await admin.auth.getUser(jwt);
  const userId = auth.user?.id;
  if (!userId) return fail(401, 'auth', m.auth);

  const parsed = parseRequest(body);
  if ('error' in parsed) return fail(400, 'bad_request', m[parsed.error]);

  if (parsed.mode === 'daily') {
    try {
      return reply(200, await daily(parsed.lang));
    } catch (e) {
      console.error('daily failed', e);
      return fail(502, 'server', m.server);
    }
  }

  let photo: { data: string; media_type: ImageType } | null = null;
  if (parsed.hasImage) {
    const img = (body as { image?: { base64?: unknown; mediaType?: unknown } }).image;
    const type = IMAGE_TYPES.find((t) => t === img?.mediaType);
    if (typeof img?.base64 !== 'string' || !type) return fail(400, 'bad_image', m.bad_image);
    if (img.base64.length > MAX_IMAGE_BASE64) return fail(400, 'bad_image', m.image_too_big);
    photo = { data: img.base64, media_type: type };
  }

  // Daily credits, separate for text and images.
  const kind: Kind = parsed.mode === 'image' || parsed.mode === 'edit' ? 'image' : 'text';
  const { data: profile } = await admin
    .from('profiles')
    .select('is_premium, premium_until')
    .eq('user_id', userId)
    .maybeSingle();
  const premium = !!profile?.is_premium && (!profile.premium_until || new Date(profile.premium_until) > new Date());
  const limit = premium ? LIMITS[kind].premium : LIMITS[kind].free;

  if (!premium) {
    const { data: usedToday, error } = await admin.rpc('usage_today', { p_kind: kind });
    if (error) return fail(500, 'server', m.server);
    if (usedToday >= DAILY_FREE_CAP[kind]) {
      return fail(429, 'sold_out', kind === 'image' ? m.sold_out_image : m.sold_out_text, { kind });
    }
  }

  let remaining: number | null = null;
  if (limit !== null) {
    const { data: left, error } = await admin.rpc('take_credit', { p_user: userId, p_limit: limit, p_kind: kind });
    if (error) return fail(500, 'server', m.server);
    if (left < 0) {
      return fail(429, 'limit', kind === 'image' ? m.limit_image : m.limit_text, { remaining: 0, kind });
    }
    remaining = left;
  }

  const refund = async () => {
    if (limit !== null) await admin.rpc('refund_credit', { p_user: userId, p_kind: kind });
  };

  try {
    if (parsed.mode === 'image') {
      const plan = (await askClaude(
        'You write safe prompts for an image generation model.',
        [{ type: 'text', text: buildImagePrompt(parsed) }],
        IMAGE_PROMPT_SCHEMA,
      )) as { allowed: boolean; prompt: string };
      if (!plan.allowed || !plan.prompt) throw new Refused();

      const out = await drawImage(plan.prompt, ASPECT[parsed.options.format] ?? '1:1');
      return reply(200, { ...out, remaining });
    }

    if (parsed.mode === 'edit' && photo) {
      const plan = (await askClaude(
        'You check photo edit requests for safety and write prompts for an image-editing model.',
        [
          { type: 'image', source: { type: 'base64', ...photo } },
          { type: 'text', text: buildEditPrompt(parsed) },
        ],
        IMAGE_PROMPT_SCHEMA,
      )) as { allowed: boolean; prompt: string };
      if (!plan.allowed || !plan.prompt) throw new Refused();
      const out = await drawImage([
        { inlineData: { mimeType: photo.media_type, data: photo.data } },
        { text: plan.prompt },
      ]);
      return reply(200, { ...out, remaining });
    }

    const out = (await askClaude(
      SYSTEM,
      [
        ...(photo ? [{ type: 'image' as const, source: { type: 'base64' as const, ...photo } }] : []),
        { type: 'text' as const, text: buildPrompt(parsed as typeof parsed & { mode: TextMode }) },
      ],
      OUTPUT_SCHEMA,
    )) as { items: { tag: string; text: string }[]; hashtags: string };
    return reply(200, { items: out.items.slice(0, 3), hashtags: out.hashtags ?? '', remaining });
  } catch (e) {
    await refund();
    if (e instanceof Refused) {
      return fail(422, 'refused', m.refused);
    }
    if (e instanceof Anthropic.RateLimitError) {
      return fail(503, 'busy', m.busy);
    }
    console.error('generate failed', e);
    return fail(502, 'server', m.server);
  }
});
