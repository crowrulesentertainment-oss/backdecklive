-- Back Deck Live YouTube broadcast manager
-- Additive migration. Existing tables and policies are not modified.
create table if not exists public.back_deck_live_broadcasts (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(btrim(title)) between 1 and 180),
 youtube_video_id text not null check (youtube_video_id ~ '^[A-Za-z0-9_-]{11} not null default 'upcoming' check (status in ('live','upcoming','ended')),
 is_featured boolean not null default false,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists back_deck_live_broadcasts_status_idx
 on public.back_deck_live_broadcasts(status,updated_at desc);
create unique index if not exists back_deck_live_one_featured_idx
 on public.back_deck_live_broadcasts(is_featured) where is_featured=true;

alter table public.back_deck_live_broadcasts enable row level security;
revoke all privileges on table public.back_deck_live_broadcasts from anon, public, authenticated;
grant select on table public.back_deck_live_broadcasts to anon, authenticated;
grant insert,update,delete on table public.back_deck_live_broadcasts to authenticated;

drop policy if exists "Public can read featured Back Deck Live broadcast" on public.back_deck_live_broadcasts;
create policy "Public can read featured Back Deck Live broadcast"
 on public.back_deck_live_broadcasts for select to anon,authenticated
 using (is_featured=true and status in ('live','upcoming'));

drop policy if exists "Back Deck admins manage live broadcasts" on public.back_deck_live_broadcasts;
create policy "Back Deck admins manage live broadcasts"
 on public.back_deck_live_broadcasts for all to authenticated
 using (exists(select 1 from public.back_deck_admins a where a.user_id=(select auth.uid())))
 with check (exists(select 1 from public.back_deck_admins a where a.user_id=(select auth.uid())));
),
 scheduled_start_at timestamptz,
 scheduled_end_at timestamptz,
 status text not null default 'upcoming' check (status in ('live','upcoming','ended')),
 is_featured boolean not null default false,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists back_deck_live_broadcasts_status_idx
 on public.back_deck_live_broadcasts(status,updated_at desc);
create unique index if not exists back_deck_live_one_featured_idx
 on public.back_deck_live_broadcasts(is_featured) where is_featured=true;

alter table public.back_deck_live_broadcasts enable row level security;
revoke all privileges on table public.back_deck_live_broadcasts from anon, public, authenticated;
grant select on table public.back_deck_live_broadcasts to anon, authenticated;
grant insert,update,delete on table public.back_deck_live_broadcasts to authenticated;

drop policy if exists "Public can read featured Back Deck Live broadcast" on public.back_deck_live_broadcasts;
create policy "Public can read featured Back Deck Live broadcast"
 on public.back_deck_live_broadcasts for select to anon,authenticated
 using (is_featured=true and status in ('live','upcoming'));

drop policy if exists "Back Deck admins manage live broadcasts" on public.back_deck_live_broadcasts;
create policy "Back Deck admins manage live broadcasts"
 on public.back_deck_live_broadcasts for all to authenticated
 using (exists(select 1 from public.back_deck_admins a where a.user_id=(select auth.uid())))
 with check (exists(select 1 from public.back_deck_admins a where a.user_id=(select auth.uid())));

-- Additive upgrade for existing broadcast-manager installations.
alter table public.back_deck_live_broadcasts
 add column if not exists scheduled_start_at timestamptz,
 add column if not exists scheduled_end_at timestamptz;

alter table public.back_deck_live_broadcasts
 drop constraint if exists back_deck_live_broadcasts_scheduled_window_check;
alter table public.back_deck_live_broadcasts
 add constraint back_deck_live_broadcasts_scheduled_window_check
 check (scheduled_end_at is null or scheduled_start_at is null or scheduled_end_at > scheduled_start_at);

create index if not exists back_deck_live_broadcasts_scheduled_start_idx
 on public.back_deck_live_broadcasts(scheduled_start_at)
 where status='upcoming';
