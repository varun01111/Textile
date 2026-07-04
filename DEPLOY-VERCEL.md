# Deploy To Vercel

This app is ready to deploy on Vercel Hobby.

Best fit for this project:

- Next.js App Router is native on Vercel
- Supabase stays external, so the free app host only serves the web app and API routes
- Google Sheets, AssemblyAI, and OpenRouter all work through environment variables

## Before You Deploy

You need:

1. A Vercel account
2. A GitHub repo for this project
3. Your Supabase project already working
4. Your AssemblyAI key
5. Your OpenRouter key
6. Your Google Sheets service account email, private key, spreadsheet id, and sheet name

## Push The Project

From the project folder:

```bash
git init
git add .
git commit -m "Initial textile intelligence app"
```

Then create a GitHub repo and push it there.

## Import Into Vercel

1. Open [https://vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Let Vercel detect `Next.js`
4. Keep the project root as this repo root
5. Add the environment variables below before the first deploy
6. Click `Deploy`

## Exact Environment Variables

Add these in Vercel Project Settings -> Environment Variables.

Required:

```text
NEXT_PUBLIC_APP_URL=https://YOUR-PROJECT.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_AUDIO_BUCKET=audio-recordings
ASSEMBLYAI_API_KEY=YOUR_ASSEMBLYAI_KEY
ASSEMBLYAI_POLL_INTERVAL_MS=3000
OPENROUTER_API_KEY=YOUR_OPENROUTER_KEY
OPENROUTER_MODEL=google/gemini-2.5-flash
GOOGLE_SHEETS_CLIENT_EMAIL=YOUR_SERVICE_ACCOUNT_EMAIL
GOOGLE_SHEETS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n
GOOGLE_SHEETS_SPREADSHEET_ID=YOUR_SPREADSHEET_ID
GOOGLE_SHEET_NAME=Conversations
ALLOWED_LOGIN_EMAILS=you@example.com,client@example.com
MOCK_PROCESSING=false
```

Optional:

```text
OPENROUTER_API_KEY_BACKUP=YOUR_BACKUP_OPENROUTER_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL=YOUR_SUPABASE_POSTGRES_URL
```

Notes:

- Keep `GOOGLE_SHEETS_PRIVATE_KEY` as one line with `\n` escapes.
- `ALLOWED_LOGIN_EMAILS` should be set before client access so random users cannot sign in.
- If you later add a custom domain, update `NEXT_PUBLIC_APP_URL` to that exact domain and redeploy.

## Supabase Auth Settings

In Supabase Dashboard:

1. Go to `Authentication -> URL Configuration`
2. Set `Site URL` to your live Vercel URL
3. Add this exact redirect URL:

```text
https://YOUR-PROJECT.vercel.app/auth/callback
```

Keep local development too:

```text
http://localhost:3000/auth/callback
http://127.0.0.1:3000/auth/callback
```

If you later move to a custom domain, also add:

```text
https://YOUR-DOMAIN.com/auth/callback
```

Supabase requires the redirect destination to match the configured Redirect URLs list.

## After First Deploy

1. Open the live Vercel URL
2. Send a magic link to an allowlisted email
3. Log in
4. Capture a short test recording
5. Confirm it reaches:
   - transcript
   - analysis
   - review page
   - Google Sheets export

## Important V1 Limitation

Current production flow uses Next.js `after()` in the capture route to continue transcription and analysis work after the upload request returns.

What this means:

- Short and medium recordings are the best fit for the current free deployment
- Very long recordings may hit serverless duration limits depending on provider latency
- If your client starts using long calls regularly, the next upgrade should move processing into a dedicated worker or queue

The capture route is already configured with a longer `maxDuration` window to improve Vercel behavior, but it is still not the same as a true background job system.

## Recommended First Live Setup

For your immediate client demo:

1. Deploy on the default `vercel.app` domain
2. Restrict access with `ALLOWED_LOGIN_EMAILS`
3. Test one real short Gujarati conversation
4. Confirm English analysis and Google Sheet export
5. Only then give the URL to your client
