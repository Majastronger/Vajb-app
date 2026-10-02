import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, FunctionsHttpError } from '@supabase/supabase-js';

// Public values (safe to ship in the app). Env vars override them for a different project.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fiqfwzapmxterynrfznc.supabase.co';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_TwIySiCuMu4m9gVcmrjDGQ__LVq_m75';

export const configured = Boolean(url && anonKey);

const supabase = configured
  ? createClient(url, anonKey, {
      auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;

export type Mode = 'caption' | 'reply' | 'bio' | 'reel' | 'wish' | 'rate';

export type GenerateRequest = {
  mode: Mode;
  lang: string;
  input: string;
  options: Record<string, string>;
  image?: { base64: string; mediaType: string };
};

export type Suggestion = { tag: string; text: string };

export type GenerateResult = {
  items: Suggestion[];
  hashtags: string;
  remaining: number | null; // null = premium (unlimited)
};

export type ImageResult = {
  image: string; // base64
  mimeType: string;
  remaining: number | null;
};

export class ApiError extends Error {
  constructor(public code: string, message: string, public remaining?: number) {
    super(message);
  }
}

async function ensureSession() {
  if (!supabase) throw new ApiError('not_configured', '');
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    const offline = error.message?.toLowerCase().includes('network');
    throw new ApiError(offline ? 'offline' : 'sign_in', '');
  }
}

async function call<T>(body: object): Promise<T> {
  await ensureSession();
  const { data, error } = await supabase!.functions.invoke('generate', { body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      throw new ApiError(body?.code ?? 'server', body?.message ?? '', body?.remaining);
    }
    throw new ApiError('offline', '');
  }
  return data as T;
}

export function generate(req: GenerateRequest): Promise<GenerateResult> {
  return call<GenerateResult>(req);
}

export function generateImage(input: string, options: Record<string, string>, lang: string): Promise<ImageResult> {
  return call<ImageResult>({ mode: 'image', input, options, lang });
}
