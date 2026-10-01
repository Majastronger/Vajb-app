# Vajb AI

Android aplikacija (kasnije i iPhone) koja mladima piše opise za objave, odgovore na poruke i bio za profil.

## Dijelovi

| Mapa | Što je |
|---|---|
| `app/` | Aplikacija (Expo / React Native) |
| `supabase/functions/generate/` | Server koji zove Claude AI i broji besplatna generiranja |
| `supabase/migrations/` | Baza: dnevni brojač i Premium korisnici |
| `.github/workflows/android.yml` | GitHub sam izgradi Android datoteke |

## Postavljanje (jednom)

### 1. Supabase (server)
1. Na supabase.com napravi novi projekt (regija: Frankfurt).
2. **Authentication → Sign In / Providers → Anonymous sign-ins → uključi.** Korisnici se ne moraju registrirati.
3. **SQL Editor**: zalijepi sadržaj datoteke `supabase/migrations/20260929000000_usage.sql` i klikni Run.
4. **Edge Functions → Deploy new function**, ime `generate`, zalijepi `index.ts` i `prompts.ts`.
5. **Edge Functions → Secrets**: dodaj `ANTHROPIC_API_KEY` (ključ s console.anthropic.com).

### 2. GitHub (izrada aplikacije)
1. **Settings → Secrets and variables → Actions → Variables** dodaj:
   - `SUPABASE_URL` (Supabase → Project Settings → API → Project URL)
   - `SUPABASE_ANON_KEY` (isto mjesto, "anon public" ključ)
2. **Actions → Android build → Run workflow.**
3. Nakon 10-15 minuta otvori završeni build i preuzmi `vajb-android`. Unutra je `vajb-test.apk`, koji možeš instalirati na mobitel.

### 3. Google Play (kasnije)
Za objavu treba "upload key". Dodaje se kao tri GitHub tajne (`UPLOAD_KEYSTORE_BASE64`, `UPLOAD_KEYSTORE_PASSWORD`, `UPLOAD_KEY_ALIAS`), nakon čega build napravi i `vajb-play.aab` za Google Play.
Prije svakog novog uploada povećaj `versionCode` u `app/app.json`.

## Troškovi AI-ja
Server koristi model `claude-opus-5-5` s niskim "effortom". Model se mijenja bez novog builda aplikacije: u Supabase Secrets postavi `CLAUDE_MODEL`, npr. `claude-haiku-4-5` za jeftiniju varijantu.

## Još nije napravljeno
- Reklame (AdMob)
- Plaćanje za Premium (Google Play Billing)
- Ikona i slike za trgovinu
