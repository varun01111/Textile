create extension if not exists pgcrypto;

create type public.conversation_type as enum (
  'in_person',
  'phone_call',
  'video_call',
  'uploaded_recording'
);

create type public.conversation_processing_status as enum (
  'draft',
  'uploaded',
  'transcribing',
  'analyzing',
  'review_required',
  'approved',
  'exported',
  'failed',
  'deleted'
);

create type public.opportunity_level as enum ('low', 'medium', 'high');
create type public.task_status as enum ('pending', 'completed');
create type public.trend_category as enum (
  'color',
  'fabric',
  'design',
  'pattern_style',
  'market_trend',
  'concern',
  'opportunity'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  client_name text not null,
  meeting_title text not null,
  meeting_date date not null,
  conversation_type public.conversation_type not null,
  consent_acknowledged boolean not null,
  audio_storage_path text,
  audio_file_name text,
  audio_mime_type text,
  audio_size_bytes bigint,
  processing_status public.conversation_processing_status not null default 'draft',
  approved_at timestamptz,
  exported_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.conversations (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  full_transcript text not null,
  detected_language text,
  transcript_provider text,
  raw_segments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_analysis (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.conversations (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  analysis jsonb not null default '{}'::jsonb,
  summary text not null,
  opportunity_level public.opportunity_level not null,
  next_action text not null,
  provider_model text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  task_text text not null,
  due_date text,
  status public.task_status not null default 'pending',
  reminder_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.trend_mentions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  category public.trend_category not null,
  label text not null,
  normalized_value text not null,
  mention_count integer not null default 1,
  source_field text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.google_sheet_exports (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.conversations (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  spreadsheet_id text not null,
  sheet_name text not null,
  row_number integer,
  export_status text not null check (export_status in ('success', 'failed')),
  exported_at timestamptz,
  payload jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists conversations_owner_status_idx
  on public.conversations (owner_id, processing_status, meeting_date desc);

create index if not exists follow_up_tasks_owner_status_idx
  on public.follow_up_tasks (owner_id, status);

create index if not exists trend_mentions_owner_category_idx
  on public.trend_mentions (owner_id, category, normalized_value);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create trigger set_transcripts_updated_at
before update on public.transcripts
for each row execute function public.set_updated_at();

create trigger set_ai_analysis_updated_at
before update on public.ai_analysis
for each row execute function public.set_updated_at();

create trigger set_follow_up_tasks_updated_at
before update on public.follow_up_tasks
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.transcripts enable row level security;
alter table public.ai_analysis enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.trend_mentions enable row level security;
alter table public.google_sheet_exports enable row level security;

create policy "profiles_self_access"
on public.profiles
for all
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "conversations_owner_access"
on public.conversations
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "transcripts_owner_access"
on public.transcripts
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "ai_analysis_owner_access"
on public.ai_analysis
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "follow_up_tasks_owner_access"
on public.follow_up_tasks
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "trend_mentions_owner_access"
on public.trend_mentions
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "google_sheet_exports_owner_access"
on public.google_sheet_exports
for all
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

insert into storage.buckets (id, name, public)
values ('audio-recordings', 'audio-recordings', false)
on conflict (id) do nothing;

create policy "audio_recordings_owner_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'audio-recordings'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "audio_recordings_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'audio-recordings'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "audio_recordings_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'audio-recordings'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'audio-recordings'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "audio_recordings_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'audio-recordings'
  and (storage.foldername(name))[1] = auth.uid()::text
);
