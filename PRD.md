
---

```md
# Kai – AI Rapper Web App PRD (V1)

## Product Information

### Product Name
Kai Web App

### Target Release
V1 MVP

### Related Links
- Productboard: TBD
- Epic: TBD
- Solo build via Claude Code
- Target domain (pending registration): listentokai.com

---

## Stakeholders

### Product Owner
Ahmad Al-Karmi

### Designer
Ahmad Al-Karmi

### Tech Lead
Ahmad Al-Karmi (solo builder via Claude Code)

---

## Business Objective

### Rationale
Kai is an AI rapper based in Kuwait — fully transparent about being artificial intelligence, producing English-language rap over oud-based Arabian-scale melodies. Kai's lyrical focus confronts topics often sidestepped in mainstream music: war, death, and systemic power abuse. The web app serves as both the living archive and the digital expression of Kai's identity, uniting music and message under one roof.

### Strategic Importance
A mobile-first web app bypasses App Store gatekeeping and content moderation constraints, enabling full creative freedom and rapid iteration. It establishes Kai's digital presence and builds an engaged early audience ahead of a native app release in V2. Kai's positioning is deliberately provocative: an AI artist with no label pressure and no career to protect — saying what others will not.

---

## Risks & Challenges

### Moderation and Brand Safety
Kai covers sensitive topics including power abuse, war, and systemic exploitation. The web-first approach avoids App Store moderation, but content framing should remain intentional and considered to protect the brand and its audience.

### Technical Dependencies
The stack relies on Vercel for hosting and Cloudflare R2 for audio and image delivery. If R2 access is disrupted or URLs change, media will break. A fallback message should be shown if media is unavailable.

### User Experience Concerns
Audio must stream reliably on mobile browsers without downloading the full MP3. The dark aesthetic must load fast without compromising design quality. Cover art image optimization is critical to avoid layout shift on slow connections.

---

## Success Metrics

### Engagement Goals
- Average session duration exceeds 3 minutes
- At least 2 songs played per session
- Song completion rate above 50%

### Retention Improvement
- 20% of visitors return within 7 days of a new track drop

---

## Target Personas

### Music Fans Curious About AI-Generated Art
Drawn by the novelty of an AI rapper with a distinct identity, these early adopters are eager to experience a new kind of artist.

### Listeners Interested in Serious Lyrical Content
Kai's focus on power, war, and systemic abuse resonates with an audience alienated by shallow mainstream rap — offering rare substance, even through artificial means.

### Tech-Savvy Early Adopters
These users care about how Kai is made. Transparency about the AI process is a feature, not a disclaimer.

---

## Assumptions

### Song Selection
All 10 existing songs will be available at launch. No user accounts or community features in V1.

### User Authentication
No login required for public users. Open access throughout. Only the admin dashboard at /admin requires password authentication.

---

## Requirements

### Admin Dashboard
The admin dashboard lives at /admin and is password-protected. Ahmad can:
- Upload a new song (MP3 file to Cloudflare R2)
- Upload cover art (image to Cloudflare R2)
- Add and edit: song title, short description, full lyrics, and optional explanation
- Publish or unpublish a song
- Edit or delete existing songs
- Song slugs are auto-generated from the title (e.g. "Black Book Margins" → /songs/black-book-margins)

### Frontend
Each song profile contains:
- Title (required)
- MP3 file (required) — streamed directly from Cloudflare R2
- Cover art (required)
- Lyrics (required)
- Explanation (optional — only renders on the song page if content exists)
- Shareable URL: listentokai.com/songs/[song-slug]

The frontend consists of two pages:
- **Library (homepage)** — vertically scrollable song list with cover art, title, and one-line description per song
- **About Kai** — secondary page, accessible via bottom navigation

A persistent mini-player appears at the bottom of the screen once a song is playing. Tapping the mini-player opens the full screen player.

### Instrumentation and Tracking
GA4 is the sole analytics tool. Installed via Next.js. Tracks:
- General traffic: visitors, location, device, session duration
- Custom events:
  - `song_play` (song title, slug)
  - `song_complete` (song title, slug)
  - `song_page_view` (song title, slug)
  - `explanation_viewed` (song title, slug — only fires if explanation exists)
  - `lyrics_viewed` (song title, slug)

---

## Infrastructure and Miscellaneous

### Environment Configuration
- **Framework:** Next.js
- **Hosting:** Vercel (free tier)
- **Audio and image storage/delivery:** Cloudflare R2 (free tier — 10GB storage, 1M reads/month; credit card required on file but no charges within free limits)
- MP3s are served directly from Cloudflare R2 — no HLS transcoding required in V1

### Security and Privacy
- Admin dashboard is password-protected; no public signup
- No listener personal data is collected or stored
- Only data stored per user: none (no accounts, no tracking beyond GA4 events)

### Operational Considerations
- Monitor R2 availability; display a "media temporarily unavailable" message if delivery fails
- Ensure Vercel environment variables for R2 access keys are set correctly for production

---

## User Interaction and Design

### Design Direction
- **Background:** #0a0a0a (near-black, not pure black)
- **Accent color:** Amber #D4820A — used for active states, progress bars, play buttons, and highlights
- **Typeface:** Space Grotesk (Google Fonts) — Bold for titles and headings, Regular for descriptions, lyrics, and metadata
- Dark, intentional aesthetic. Cover art does the visual heavy lifting. UI recedes behind the music.
- Feels like a digital zine or manifesto — not a music streaming platform clone
- Kai's AI identity is present as a statement, not a disclaimer

### Competitor References
- Inspired by Spotify's interaction patterns (persistent player, mini-player → full screen player)
- Not a Spotify clone — visual identity, copy, and personality are unique to Kai

---

## Open Questions

### Domain Registration
listentokai.com is the target domain — availability to be confirmed and registered before launch.

### Database vs. JSON
Before Phase 6 (admin dashboard), a decision is needed on data storage: a hardcoded JSON file in the repo (requires redeployment on new uploads) vs. a lightweight database like Supabase or PlanetScale (instant updates, no redeployment). To be decided during build.

---

## Decision Log

### Platform
Web-first (responsive mobile) chosen over native app to ship faster and avoid App Store content moderation. V2 will be native mobile.

### Infrastructure Stack
Next.js + Vercel + Cloudflare R2. Fully free at V1 scale. No HLS transcoding — MP3s served directly from R2.

### Analytics
GA4 only. Handles both traffic analytics and custom song-level event tracking. No additional tool needed.

### Push Notifications
Dropped from V1. Will be implemented in the native mobile app in V2.

### Song Profile
Each song includes: Title, MP3, Cover art, Lyrics (all required) and Explanation (optional). Each song has a dedicated shareable URL at /songs/[song-slug].

### Frontend First
Frontend is built before the admin dashboard. Static/hardcoded data used during frontend build phases. Admin dashboard built in Phase 6, informed by what the frontend actually needs.

---

## Out of Scope

### Excluded Platforms
- No native iOS or Android apps in V1
- Native apps planned for V2 after validating audience interest

### Unsupported Features
- Push notifications (deferred to V2)
- User accounts, registration, or personalization
- Community features: comments, voting, social interaction
- Generative AI interaction with Kai
- Song downloads (streaming only)
- Behind-the-scenes or "making of" content
```

---

