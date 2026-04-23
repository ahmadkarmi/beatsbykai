# Kai — Project Memory

## Current Phase
Phase 6 — Admin dashboard + DB decision

## Key Decisions Made

- **Frontend-first:** Static/hardcoded song data used through Phase 5. DB decision deferred to Phase 6.
- **Database:** Supabase recommended for Phase 6 (admin dashboard). Will confirm with Ahmad before implementing.
- **Auth:** Single admin password via `ADMIN_PASSWORD` env var. No library like NextAuth required.
- **R2:** MP3s and cover art served directly from Cloudflare R2 (no CDN wrapping in V1).
- **Player state:** React Context (no external state lib needed at this scope).
- **No HLS:** Direct MP3 streaming from R2, browser native `<audio>` element.

## Open Questions

- [ ] Confirm Supabase vs alternative for admin DB (before Phase 6)
- [ ] Domain registration: listentokai.com
- [ ] GA4 Measurement ID (needed for Phase 8)
- [ ] R2 bucket name + public URL pattern (needed for Phase 7)

## Song Data (Static — Phases 1–5)

Hardcoded in `lib/data/songs.ts`. Placeholder data until admin dashboard is live.

## Environment Variables Required

```
# Phase 6+
ADMIN_PASSWORD=

# Phase 7+
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
NEXT_PUBLIC_R2_PUBLIC_URL=

# Phase 8+
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
```
