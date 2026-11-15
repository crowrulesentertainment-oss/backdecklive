# Back Deck Live

A CrowRules Entertainment production. **Real Conversations. Real People. Real Life.**

This repository contains the GitHub Pages website foundation for Back Deck Live.

## Website

- Home: `/`
- Watch Live: `/pages/live/`
- Episodes: `/pages/episodes/`
- Community: `/pages/community/`
- About: `/pages/about/`
- Guest Lounge: `/pages/guest-lounge/`
- Admin foundation: `/admin/`

## Hosting

Enable GitHub Pages in repository Settings → Pages, using the `main` branch and `/(root)`. The expected public URL is:

https://crowrulesentertainment-oss.github.io/backdecklive/

## Current implementation status

The public visual foundation and initial page routes are in place. The admin page is a non-functional workspace shell, not an authenticated system. Community and guest forms are previews and do not transmit or store data. The live player and episode library require channel/video/playlist configuration.

## Configuration still required

1. Confirm the official Back Deck Live YouTube channel and playlist IDs. A general CrowRules TV channel URL is linked as a temporary destination, not assumed to be the final Back Deck Live channel.
2. Configure a YouTube Data API project if live status, playlist synchronization or analytics are required.
3. Configure the existing Supabase project using its project URL and browser-safe anon/publishable key. Never commit a service-role key.
4. Review the current Supabase schema and RLS policies before adding any `bdl_*` tables. Reuse compatible structures and do not alter unrelated CrowRules systems.
5. Implement server-side/Edge Function handling for public submissions and privileged operations, with validation, rate limiting and moderation.
6. Implement Supabase Auth and role-based access before exposing admin functionality.
7. Enable GitHub Pages and test all routes on desktop and mobile.

## Architecture

- Static hosting: GitHub Pages
- Front end: HTML, CSS and JavaScript
- Authentication/database: Supabase (planned)
- Video: YouTube embeds and APIs (planned)
- Admin: separate private application area (planned)

## Design direction

Cinematic Pacific Northwest back-deck atmosphere combined with a modern streaming interface. Forest green, cedar, charcoal, cream and amber/gold.

## Production rhythm

Regular show schedule: Saturdays at 3 PM Pacific. Typical episode length: 60–90 minutes. Mostly solo with occasional guests.

## Security

Do not store secrets, service-role keys, OAuth client secrets or private API tokens in this public repository. Public submissions must not be presented as functional until a secure backend is connected.
