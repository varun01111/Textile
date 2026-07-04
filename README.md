# Textile Client Conversation Intelligence

Single-owner Next.js PWA for recording or uploading consent-based textile client conversations, transcribing them, extracting structured business insights, and exporting the approved result into a master Google Sheet.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, and Storage
- AssemblyAI for transcription
- OpenRouter with Gemini 2.5 Flash for structured analysis
- Google Sheets API for exports

## API And Service Checklist

These are the integrations this app uses:

1. Supabase Auth, Database, and Storage
2. AssemblyAI API
3. OpenRouter API
4. Google Sheets API

What you need in practice:

1. Minimum to start the app: Supabase
2. Minimum to test the workflow without live AI: Supabase plus `MOCK_PROCESSING=true`
3. Full live processing: Supabase + AssemblyAI + OpenRouter
4. Final export to spreadsheet: Google Sheets API and a service account

## Routes

- `/login` magic-link owner login
- `/dashboard` conversation history and filters
- `/capture` visible recording and upload flow
- `/conversations/[id]` review, edit, approve, delete
- `/follow-ups` reminder queue, snoozes, completions, and edits
- `/trends` repeated textile signal memory

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Fill in the environment variables in `.env.local`.

4. Run the Supabase SQL migration from `supabase/migrations/20260629_textile_intelligence_init.sql`.

5. Start the app:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

Note:
On this Windows machine, the project scripts are configured with `NODE_OPTIONS=--use-system-ca` so local API calls can trust the system certificate store for Google Sheets, OpenRouter, and similar HTTPS services.

## Environment variables

- `NEXT_PUBLIC_APP_URL` public app URL for magic-link callbacks and stable transcript/audio links.
- `NEXT_PUBLIC_SUPABASE_URL` Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` Supabase anon key.
- `SUPABASE_SERVICE_ROLE_KEY` optional server-side key for future automation paths. The single-owner MVP can run without it.
- `SUPABASE_AUDIO_BUCKET` private bucket name. Default is `audio-recordings`.
- `DATABASE_URL` optional raw Postgres connection string for SQL tools. The app does not require this for normal runtime behavior.
- `ASSEMBLYAI_API_KEY` AssemblyAI API key.
- `ASSEMBLYAI_POLL_INTERVAL_MS` polling interval for transcript jobs. Default is `3000`.
- `OPENROUTER_API_KEY` OpenRouter API key.
- `OPENROUTER_API_KEY_BACKUP` optional backup OpenRouter API key used automatically if the primary key runs out of credits or hits a retryable provider limit.
- `OPENROUTER_MODEL` model used for structured analysis. Default is `google/gemini-2.5-flash`.
- `GOOGLE_SHEETS_CLIENT_EMAIL` service account email with spreadsheet access.
- `GOOGLE_SHEETS_PRIVATE_KEY` service account private key with `\n` escapes preserved.
- `GOOGLE_SHEETS_SPREADSHEET_ID` target spreadsheet id.
- `GOOGLE_SHEET_NAME` target tab name. Default is `Conversations`.
- `ALLOWED_LOGIN_EMAILS` optional comma-separated allowlist for who can sign in. Leave empty to allow any email that can complete Supabase auth.
- `MOCK_PROCESSING` optional. Set `true` to let missing or currently failing transcription and/or analysis services fall back to mock output during local workflow testing.

## Supabase setup

1. Create a new Supabase project.
2. Run the SQL migration file listed above.
3. Confirm the private storage bucket `audio-recordings` exists.
4. Create a single owner user in Supabase Auth or sign in once through the app.
5. Copy the project URL and anon key into `.env.local`. Add the service-role key only if you want it available for future server-side automation.

If you currently only have a Supabase Postgres connection string like:

```text
postgresql://postgres:[YOUR-PASSWORD]@db.<project-ref>.supabase.co:5432/postgres
```

Use it like this:

1. Derive `NEXT_PUBLIC_SUPABASE_URL` as `https://<project-ref>.supabase.co`
2. Keep the Postgres password private
3. Still fetch `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Supabase dashboard
4. Optionally fetch `SUPABASE_SERVICE_ROLE_KEY` too if you want it stored for future server-side automation
5. Use `DATABASE_URL` only if you want direct SQL access from tools

## Google Sheets setup

1. Create one master spreadsheet.
2. Add a tab named `Conversations`, or change `GOOGLE_SHEET_NAME`.
3. Create a Google Cloud service account.
4. Enable the Google Sheets API.
5. Share the spreadsheet with the service account email as an editor.
6. Put the service account email, private key, and spreadsheet id into `.env.local`.

## Client trial access

For a short client pilot, the safest setup is:

1. Deploy the app to a stable URL.
2. Set `NEXT_PUBLIC_APP_URL` to that deployed URL.
3. Add `ALLOWED_LOGIN_EMAILS=you@example.com,client@example.com` in `.env.local`.
4. Ask the client to sign in with one of those exact email addresses.

If `ALLOWED_LOGIN_EMAILS` is left blank, any email address that can complete Supabase auth can create its own isolated workspace.

## Vercel deployment

This app is prepared for Vercel Hobby deployment.

Use:

1. Vercel for hosting
2. Supabase for auth, database, and storage
3. AssemblyAI for transcription
4. OpenRouter for analysis
5. Google Sheets API for export

For the full publish checklist, exact Vercel env vars, and Supabase auth URL setup, see `DEPLOY-VERCEL.md`.

## Processing flow

1. Capture metadata and confirm consent.
2. Record in-browser or upload an existing audio file.
3. Store the audio in private Supabase Storage.
4. Transcribe with AssemblyAI.
5. Analyze with OpenRouter into structured textile-business JSON.
6. Review and edit the result in `/conversations/[id]`.
7. Work the live reminder queue in `/follow-ups` for snoozes, completions, and due-date cleanup.
8. Approve and export one final row into Google Sheets.
9. Update dashboard cards and the trend memory page from Supabase data.

## Tests

Run the focused unit and workflow tests with:

```bash
npm test
```

These tests cover:

- AI analysis schema validation
- audio upload validation
- opportunity normalization
- follow-up task extraction
- reminder scheduling and follow-up autopilot grouping
- trend normalization
- Google Sheets row serialization
- a mock happy-path pipeline pass

## Notes

- Recording is always visible. There are no hidden or background recording features.
- Export is intentionally manual-after-review in the MVP.
- Reminder nudges stay in-app in this version. External WhatsApp, email, and calendar automations are the next upgrade layer.
- Deleting a conversation removes app-side assets and marks the conversation deleted. If it was already exported, the spreadsheet row remains in place in v1.
