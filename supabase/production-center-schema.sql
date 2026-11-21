-- Back Deck Live Production Center
-- Additive schema only. Existing Back Deck Live tables, data, and policies are untouched.
create table if not exists public.back_deck_production_episodes (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(btrim(title)) between 1 and 180),
 episode_code text,
 episode_type text not null default 'regular' check (episode_type in ('regular','special','seasonal','remote')),
 status text not null default 'idea' check (status in ('idea','planning','ready_to_record','recorded','editing','scheduled','published','on_hold')),
 target_recording_at timestamptz,
 target_publish_at timestamptz,
 runtime_minutes integer check (runtime_minutes is null or runtime_minutes between 1 and 480),
 topic text not null default '',
 outline text not null default '',
 production_notes text not null default '',
 host_names text not null default '',
 youtube_video_id text check (youtube_video_id is null or youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
 linked_episode_id uuid references public.back_deck_episodes(id) on delete set null,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.back_deck_broadcast_schedule (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(btrim(title)) between 1 and 180),
 broadcast_type text not null default 'weekly' check (broadcast_type in ('weekly','special','premiere','rehearsal','recording')),
 starts_at timestamptz not null,
 ends_at timestamptz,
 status text not null default 'planned' check (status in ('planned','confirmed','live','completed','cancelled')),
 youtube_url text,
 location_or_platform text not null default 'CrowRules TV · YouTube',
 notes text not null default '',
 production_episode_id uuid references public.back_deck_production_episodes(id) on delete set null,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint back_deck_schedule_end_after_start check (ends_at is null or ends_at > starts_at)
);
create table if not exists public.back_deck_guest_bookings (
 id uuid primary key default gen_random_uuid(),
 guest_name text not null check (char_length(btrim(guest_name)) between 1 and 120),
 email text not null check (char_length(btrim(email)) between 3 and 254),
 location text not null default '',
 profile_url text,
 proposed_topic text not null default '',
 bio text not null default '',
 booking_status text not null default 'new' check (booking_status in ('new','contacted','interested','confirmed','completed','declined','cancelled')),
 preferred_at timestamptz,
 confirmed_at timestamptz,
 production_episode_id uuid references public.back_deck_production_episodes(id) on delete set null,
 private_notes text not null default '',
 source_submission_id uuid references public.back_deck_submissions(id) on delete set null,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.back_deck_production_tasks (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(btrim(title)) between 1 and 180),
 description text not null default '',
 category text not null default 'production' check (category in ('planning','research','guest','recording','editing','publishing','promotion','technical','production')),
 status text not null default 'todo' check (status in ('todo','in_progress','blocked','done')),
 priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
 due_at timestamptz,
 assigned_to text not null default '',
 production_episode_id uuid references public.back_deck_production_episodes(id) on delete cascade,
 sort_order integer not null default 100,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists back_deck_prod_episode_status_idx on public.back_deck_production_episodes(status,target_publish_at);
create index if not exists back_deck_schedule_starts_idx on public.back_deck_broadcast_schedule(starts_at);
create index if not exists back_deck_guest_status_idx on public.back_deck_guest_bookings(booking_status,created_at desc);
create index if not exists back_deck_tasks_status_due_idx on public.back_deck_production_tasks(status,due_at);
create unique index if not exists back_deck_guest_source_submission_unique on public.back_deck_guest_bookings(source_submission_id) where source_submission_id is not null;
alter table public.back_deck_production_episodes enable row level security;
alter table public.back_deck_broadcast_schedule enable row level security;
alter table public.back_deck_guest_bookings enable row level security;
alter table public.back_deck_production_tasks enable row level security;
revoke all privileges on table public.back_deck_production_episodes from anon, public, authenticated;
revoke all privileges on table public.back_deck_broadcast_schedule from anon, public, authenticated;
revoke all privileges on table public.back_deck_guest_bookings from anon, public, authenticated;
revoke all privileges on table public.back_deck_production_tasks from anon, public, authenticated;
grant select,insert,update,delete on public.back_deck_production_episodes to authenticated;
grant select,insert,update,delete on public.back_deck_broadcast_schedule to authenticated;
grant select,insert,update,delete on public.back_deck_guest_bookings to authenticated;
grant select,insert,update,delete on public.back_deck_production_tasks to authenticated;
drop policy if exists "Back Deck admins manage production episodes" on public.back_deck_production_episodes;
create policy "Back Deck admins manage production episodes" on public.back_deck_production_episodes for all to authenticated using (exists(select 1 from public.back_deck_admins a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.back_deck_admins a where a.user_id=(select auth.uid())));
drop policy if exists "Back Deck admins manage broadcast schedule" on public.back_deck_broadcast_schedule;
create policy "Back Deck admins manage broadcast schedule" on public.back_deck_broadcast_schedule for all to authenticated using (exists(select 1 from public.back_deck_admins a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.back_deck_admins a where a.user_id=(select auth.uid())));
drop policy if exists "Back Deck admins manage guest bookings" on public.back_deck_guest_bookings;
create policy "Back Deck admins manage guest bookings" on public.back_deck_guest_bookings for all to authenticated using (exists(select 1 from public.back_deck_admins a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.back_deck_admins a where a.user_id=(select auth.uid())));
drop policy if exists "Back Deck admins manage production tasks" on public.back_deck_production_tasks;
create policy "Back Deck admins manage production tasks" on public.back_deck_production_tasks for all to authenticated using (exists(select 1 from public.back_deck_admins a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.back_deck_admins a where a.user_id=(select auth.uid())));


-- Live show rundown and control room
create table if not exists public.back_deck_show_rundown (
 id uuid primary key default gen_random_uuid(),
 production_episode_id uuid not null references public.back_deck_production_episodes(id) on delete cascade,
 broadcast_schedule_id uuid references public.back_deck_broadcast_schedule(id) on delete set null,
 segment_title text not null check (char_length(btrim(segment_title)) between 1 and 180),
 segment_type text not null default 'conversation' check (segment_type in ('opening','conversation','guest','feature','community','break','closing','technical')),
 sort_order integer not null default 10,
 duration_minutes integer not null default 5 check (duration_minutes between 1 and 180),
 host_or_lead text not null default '',
 producer_notes text not null default '',
 production_cue text not null default '',
 status text not null default 'pending' check (status in ('pending','ready','on_air','completed','skipped')),
 actual_started_at timestamptz,
 actual_ended_at timestamptz,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists back_deck_rundown_episode_order_idx on public.back_deck_show_rundown(production_episode_id,sort_order);
create index if not exists back_deck_rundown_status_idx on public.back_deck_show_rundown(status);
alter table public.back_deck_show_rundown enable row level security;
revoke all privileges on table public.back_deck_show_rundown from anon, public, authenticated;
grant select,insert,update,delete on public.back_deck_show_rundown to authenticated;
drop policy if exists "Back Deck admins manage show rundowns" on public.back_deck_show_rundown;
create policy "Back Deck admins manage show rundowns" on public.back_deck_show_rundown for all to authenticated using (exists(select 1 from public.back_deck_admins a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.back_deck_admins a where a.user_id=(select auth.uid())));
