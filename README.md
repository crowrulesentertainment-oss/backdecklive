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
