-- Restrict public broadcast reads to player-safe columns.
-- Admin CRUD remains on back_deck_live_broadcasts under its existing RLS policy.
revoke select on table public.back_deck_live_broadcasts from anon;
grant select (id,title,youtube_video_id,status,is_featured,scheduled_start_at,scheduled_end_at,updated_at)
 on table public.back_deck_live_broadcasts to anon;
create or replace view public.back_deck_live_broadcast_public
 with (security_invoker=true)
 as
 select id,title,youtube_video_id,status,is_featured,scheduled_start_at,scheduled_end_at,updated_at
 from public.back_deck_live_broadcasts
 where is_featured=true and status in ('live','upcoming');
grant select on table public.back_deck_live_broadcast_public to anon,authenticated;
