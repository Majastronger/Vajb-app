import Anthropic from 'npm:@anthropic-ai/sdk@0.129.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { buildPrompt, OUTPUT_SCHEMA, parseRequest, SYSTEM } from './prompts.ts';

const FREE_PER_DAY = 5;
const MODEL = Deno.env.get('CLAUDE_MODEL') ?? 'claude-opus-5-5';
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return fail(405, 'method', 'Samo POST.');

  // Who is asking (anonymous Supabase user).
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const { data: auth } = await admin.auth.getUser(jwt);
  const userId = auth.user?.id;
  if (!userId) return fail(401, 'auth', 'Prijava nije uspjela. Zatvori i ponovno otvori aplikaciju.');

  const body = await req.json().catch(() => null);
  const parsed = parseRequest(body);
  if (typeof parsed === 'string') return fail(400, 'bad_request', parsed);

  let image: { data: string; media_type: ImageType } | null = null;
  if (parsed.hasImage) {
    const img = (body as { image?: { base64?: unknown; mediaType?: unknown } }).image;
    const type = IMAGE_TYPES.find((t) => t === img?.mediaType);
    if (typeof img?.base64 !== 'string' || !type) return fail(400, 'bad_image', 'Ova vrsta slike nije podržana.');
    if (img.base64.length > MAX_IMAGE_BASE64) return fail(400, 'bad_image', 'Slika je prevelika.');
    image = { data: img.base64, media_type: type };
  }

  // Premium users are unlimited; everyone else gets FREE_PER_DAY a day.
  const { data: profile } = await admin
    .from('profiles')
    .select('is_premium, premium_until')
    .eq('user_id', userId)
    .maybeSingle();
  const premium = !!profile?.is_premium && (!profile.premium_until || new Date(profile.premium_until) > new Date());

  let remaining: number | null = null;
  if (!premium) {
    const { data: left, error } = await admin.rpc('take_credit', { p_user: userId, p_limit: FREE_PER_DAY });
    if (error) return fail(500, 'server', 'Nešto je pošlo po zlu. Probaj opet.');
    if (left < 0) {
      return fail(429, 'limit', `Potrošio/la si ${FREE_PER_DAY} besplatnih generiranja za danas.`, { remaining: 0 });
    }
    remaining = left;
  }

  const refund = async () => {
    if (!premium) await admin.rpc('refund_credit', { p_user: userId });
  };

  try {
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            ...(image ? [{ type: 'image' as const, source: { type: 'base64' as const, ...image } }] : []),
            { type: 'text' as const, text: buildPrompt(parsed) },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      await refund();
      return fail(422, 'refused', 'AI ne može odgovoriti na ovaj tekst. Probaj ga preformulirati.');
    }

    const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
    const out = JSON.parse(text) as { items: { tag: string; text: string }[]; hashtags: string };
    return reply(200, { items: out.items.slice(0, 3), hashtags: out.hashtags ?? '', remaining });
  } catch (e) {
    await refund();
    if (e instanceof Anthropic.RateLimitError) {
      return fail(503, 'busy', 'Puno je ljudi trenutno. Probaj za minutu.');
    }
    console.error('generate failed', e);
    return fail(502, 'server', 'Nešto je pošlo po zlu. Probaj opet.');
  }
});
