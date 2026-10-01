import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, FunctionsHttpError } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const configured = Boolean(url && anonKey);

const supabase = configured
  ? createClient(url, anonKey, {
      auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;

export type Mode = 'caption' | 'reply' | 'bio';

export type GenerateRequest = {
  mode: Mode;
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

export class ApiError extends Error {
  constructor(public code: string, message: string, public remaining?: number) {
    super(message);
  }
}

async function ensureSession() {
  if (!supabase) throw new ApiError('not_configured', 'Server nije podešen.');
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw new ApiError('auth', 'Ne mogu se spojiti. Provjeri internet pa probaj opet.');
}

export async function generate(req: GenerateRequest): Promise<GenerateResult> {
  await ensureSession();
  const { data, error } = await supabase!.functions.invoke('generate', { body: req });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      throw new ApiError(body?.code ?? 'server', body?.message ?? 'Nešto je pošlo po zlu. Probaj opet.', body?.remaining);
    }
    throw new ApiError('network', 'Nema veze sa serverom. Provjeri internet pa probaj opet.');
  }
  return data as GenerateResult;
}
