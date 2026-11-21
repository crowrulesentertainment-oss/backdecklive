# Back Deck Live

A CrowRules Entertainment production. **Real Conversations. Real People. Real Life.**

A cinematic Pacific Northwest gathering place, built as a responsive static website for GitHub Pages.

## Live website
https://crowrulesentertainment-oss.github.io/backdecklive/

## Public pages
- Home: /
- Watch Live: /pages/live/
- Episodes: /pages/episodes/
- Schedule & special events: /pages/schedule/
- Community submissions: /pages/community/
- Guest Lounge: /pages/guest-lounge/
- People of the Deck: /pages/crew/
- About: /pages/about/
- FAQ: /pages/faq/
- Contact: /pages/contact/
- Admin entry: /admin/

## Show rhythm
Regular gathering: **Saturdays at 3:00 PM Pacific**. Typical episodes are 60–90 minutes, with a mostly solo format and occasional guests. Special broadcasts can be featured separately on the schedule page.

## Technical architecture
- Static hosting: GitHub Pages
- Front end: HTML, CSS and vanilla JavaScript
- Database/auth integration: existing Supabase project and existing Back Deck Live tables
- Video: YouTube embeds and the existing Back Deck Live Edge Function
- Real-time presence: existing Supabase Realtime channel on the Watch Live page
- Administration: existing CrowRules Entertainment admin destination

## Data and security preservation
This website upgrade adds static public pages and presentation/navigation enhancements. It does not create, rename, migrate, or delete Supabase tables; alter RLS policies; replace the existing Edge Function; or expose service-role credentials. Public forms continue to use the existing `back_deck_submissions` integration and remain subject to the existing database security policies.

Never commit service-role keys, OAuth client secrets or private API tokens. Public submissions should remain private until reviewed by the production team.

## Deployment
GitHub Pages should use the `main` branch and `/(root)` as the publishing source. After a push, allow Pages to finish its deployment, then test the public pages on desktop and mobile.


## Production Center
Secure workspace: https://crowrulesentertainment-oss.github.io/backdecklive/production-center/

- Supabase Auth sign-in with the existing `back_deck_admins` allowlist; no public registration or self-service admin elevation.
- Episode planning: episode type, pipeline status, record/publish targets, runtime, contributors, topic, run-of-show, production notes and YouTube ID.
- Broadcast scheduling: weekly shows, special events, premieres, rehearsals and recording sessions, with dates, status, YouTube URL and linked episode.
- Guest bookings: private guest contact information, proposed topics, preferred times, booking pipeline and private production notes.
- Crew management: reuses the existing `back_deck_crew` table and its existing admin policies.
- Production checklist: tasks by department, priority, assignee, due date, linked episode and completion status; includes a weekly-show task template.
- Guest intake: authorized staff can convert existing public guest-interest submissions into private booking records, with duplicate conversion prevented by a unique source-submission index.

### New database tables
- `back_deck_production_episodes`
- `back_deck_broadcast_schedule`
- `back_deck_guest_bookings`
- `back_deck_production_tasks`
- `back_deck_show_rundown`

All four new tables have RLS enabled and are restricted to authenticated users present in `back_deck_admins`. Anonymous/public grants are revoked; authenticated table privileges are limited to SELECT, INSERT, UPDATE and DELETE, with RLS policies enforcing the administrator allowlist. Guest contact details and private notes are not exposed to public roles.

The additive schema is documented in `supabase/production-center-schema.sql`. The live rundown stores timed segments, segment leads, producer notes, production cues, status and actual start/end timestamps, linked to episode plans and optional broadcast schedule entries. Its RLS policy uses the same existing administrator allowlist. No existing Back Deck Live tables or RLS policies were dropped or replaced.

### Weekly calendar and reminders
- Weekly calendar combines broadcast schedule entries, episode recording/publish targets, and open checklist tasks with due dates.
- Week navigation supports previous, current and next week; current day is highlighted.
- Reminder center surfaces overdue tasks, tasks due within 48 hours, upcoming broadcasts, episode milestones and guest follow-ups.
- Optional browser notifications can alert for items in the next 24 hours while an authorized administrator keeps the Production Center open. Browser notifications are device/browser-local and are not email/SMS; they cannot run while the page is closed.
- A separate weekly ChatGPT reminder prompts the producer on Friday mornings to review the Saturday show checklist, guests, crew, recording/editing, upload/premiere and promotion.
## Live telemetry connections

The Production Center Technical Broadcast Panel can read live telemetry without storing credentials in the public repository.

### OBS Studio (local WebSocket)
1. Use OBS Studio 28 or later (obs-websocket v5 is included).
2. In OBS, open Tools → WebSocket Server Settings, enable the WebSocket server, keep authentication enabled, and use the configured port (default 4455).
3. Keep OBS and the Production Center open on the same computer. In Technical preflight → OBS & YouTube connections, use host 127.0.0.1, port 4455, enter the OBS WebSocket password, and select Connect to OBS.
4. The panel polls OBS stream status and statistics every three seconds: output state/reconnecting, estimated bitrate from output-byte deltas, skipped output frames and percentage, active FPS, CPU and output congestion.
5. The OBS password is held only in the page's memory/input field and is not written to localStorage or sent to Supabase. Disconnect or close the page to end the session.

Do not expose the OBS WebSocket port to the public internet. Keep it on localhost and use OBS authentication. A browser-based connection to a remote LAN host may be blocked by HTTPS mixed-content/browser security; use a local computer address and a supported secure local bridge if the production computer is remote.

### YouTube Live (read-only OAuth)
1. In Google Cloud Console, create/select a project, enable YouTube Data API v3, and configure the OAuth consent screen.
2. Create an OAuth 2.0 Client ID → Web application. Add https://crowrulesentertainment-oss.github.io as an authorized JavaScript origin.
3. Paste the Web Client ID (not a client secret) into the YouTube connection field in the Technical Broadcast Panel and select Connect YouTube read-only.
4. Approve the youtube.readonly scope for the CrowRules channel. The panel reads the channel's live broadcast lifecycle, linked ingest stream status and YouTube health/configuration issues, refreshing every 30 seconds.

The Google OAuth client ID is a public identifier and may be stored locally in this browser. The access token remains in memory only; no OAuth client secret is used in the browser and no token is committed to GitHub. Disconnect YouTube or close the page to discard the token. YouTube API quota and channel live-streaming eligibility still apply.

### Interpretation and fallback
- OBS metrics describe the encoder/output on the computer running OBS; YouTube health describes platform ingest. They are distinct signals and should be reviewed together.
- Estimated bitrate is calculated from OBS output bytes between telemetry polls; it is not a YouTube viewer-delivery bitrate.
- OBS dropped-frame percentage is based on the output's skipped-frame and total-frame counters. Render-thread skips are shown separately in the update line.
- Manual operator checks and backup-path verification remain available. A successful OBS connection does not verify microphones, cameras, remote guests, or backup-stream readiness.
- No production database tables or RLS policies are changed by these integrations.
