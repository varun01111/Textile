# Vercel Env Status

Use this as the quick copy checklist while filling Vercel Project Settings -> Environment Variables.

## Ready To Copy From `.env.local`

These already exist locally and can be copied into Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_AUDIO_BUCKET`
- `DATABASE_URL`
- `ASSEMBLYAI_API_KEY`
- `ASSEMBLYAI_POLL_INTERVAL_MS`
- `OPENROUTER_API_KEY`
- `OPENROUTER_API_KEY_BACKUP`
- `OPENROUTER_MODEL`
- `GOOGLE_SHEETS_CLIENT_EMAIL`
- `GOOGLE_SHEETS_PRIVATE_KEY`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEET_NAME`
- `MOCK_PROCESSING`

## Needs A Production Value

These should be set deliberately for the live deployment:

- `NEXT_PUBLIC_APP_URL`
  - Local value is `http://127.0.0.1:3000`
  - Replace it in Vercel with your live URL, for example:
    - `https://YOUR-PROJECT.vercel.app`

- `ALLOWED_LOGIN_EMAILS`
  - Not currently set in `.env.local`
  - Add a strict allowlist before client access, for example:
    - `your-email@example.com,client-email@example.com`

## Optional

- `SUPABASE_SERVICE_ROLE_KEY`
  - Not currently set locally
  - The app can run without it for the current MVP

## Safe Defaults Confirmed

- `SUPABASE_AUDIO_BUCKET=audio-recordings`
- `ASSEMBLYAI_POLL_INTERVAL_MS=3000`
- `OPENROUTER_MODEL=google/gemini-2.5-flash`
- `GOOGLE_SHEET_NAME=Conversations`
- `MOCK_PROCESSING=false`

## After You Add The Variables

1. Redeploy the app
2. In Supabase Auth, set:
   - `Site URL = https://YOUR-PROJECT.vercel.app`
   - `Redirect URL = https://YOUR-PROJECT.vercel.app/auth/callback`
3. Test one short Gujarati conversation
