-- Back Deck Live database proposal only.
-- Review the existing Supabase project before running this SQL.
-- Do not execute blindly or modify unrelated CrowRules tables.
-- Implement RLS policies and server-side validation before enabling forms/admin.

create table if not exists public.bdl_episodes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  episode_number text,
  description text,
  youtube_video_id text,
  youtube_playlist_id text,
  thumbnail_url text,
  published_at timestamptz,
  status text not null default 'draft' check (status in ('draft','scheduled','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bdl_broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  youtube_broadcast_id text,
  youtube_video_id text,
  scheduled_at timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming','live','complete','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.bdl_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_type text not null check (submission_type in ('topic','weekly_question','guest_nomination','story','general')),
  display_name text not null,
  email text,
  body text not null,
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','rejected','published')),
  created_at timestamptz not null default now()
);

create table if not exists public.bdl_guest_applications (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  email text not null,
  location text,
  website_url text,
  biography text not null,
  proposed_topic text not null,
  status text not null default 'new' check (status in ('new','reviewing','invited','scheduled','declined','completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.bdl_production_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  episode_number text,
  topic text,
  outline text,
  production_stage text not null default 'idea' check (production_stage in ('idea','planning','preparation','recording','post_production','ready_to_publish','published','archived')),
  target_publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Before enabling browser access:
-- 1. Enable RLS on every table.
-- 2. Keep submissions and guest applications private by default.
-- 3. Route anonymous inserts through a validated, rate-limited Edge Function.
-- 4. Restrict writes to production/admin roles.
-- 5. Add audit logging and retention policies.
-- 6. Never expose service-role credentials to the browser.
