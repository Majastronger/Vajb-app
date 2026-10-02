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
Projekt "Vajb AI" (Frankfurt) već postoji, s bazom i funkcijom `generate`. Ostalo je:
1. **Authentication → Sign In / Providers → Anonymous sign-ins → uključi.** Korisnici se ne moraju registrirati.
2. **Edge Functions → Secrets**: dodaj `ANTHROPIC_API_KEY` (ključ s console.anthropic.com).

### 2. GitHub (izrada aplikacije)
1. **Actions → Android build → Run workflow.**
2. Nakon 10-15 minuta otvori završeni build i preuzmi `vajb-android`. Unutra je `vajb-test.apk`, koji možeš instalirati na mobitel.

### 3. Google Play (kasnije)
Za objavu treba "upload key". Dodaje se kao tri GitHub tajne (`UPLOAD_KEYSTORE_BASE64`, `UPLOAD_KEYSTORE_PASSWORD`, `UPLOAD_KEY_ALIAS`), nakon čega build napravi i `vajb-play.aab` za Google Play.
Prije svakog novog uploada povećaj `versionCode` u `app/app.json`.

## Troškovi AI-ja
Tekst piše Claude (`claude-opus-5-5`, nizak "effort"), slike Google Gemini (`gemini-2.5-flash-image`, ključ `GOOGLE_API_KEY` u Supabase Secrets, model se mijenja s `IMAGE_MODEL`). Model se mijenja bez novog builda aplikacije: u Supabase Secrets postavi `CLAUDE_MODEL`, npr. `claude-haiku-4-5` za jeftiniju varijantu.

## Još nije napravljeno
- Reklame (AdMob)
- Plaćanje za Premium (Google Play Billing)
- Ikona i slike za trgovinu

## Alati u aplikaciji
Slika iz opisa, Opis objave, Što da odgovorim, Ideja za video, Čestitka, Ocijeni fotku, Bio. Besplatno: 5 tekstova i 1 slika dnevno; Premium: neograničeno tekstova i 20 slika.
