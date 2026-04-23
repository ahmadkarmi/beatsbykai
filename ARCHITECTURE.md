# Kai Web App — Architecture

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR/SSG, file-based routing |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS v4 | Utility-first, custom tokens |
| Hosting | Vercel (free tier) | CI/CD via GitHub |
| Media storage | Cloudflare R2 | MP3s + cover art, S3-compatible |
| Database | TBD — static JSON (V1 frontend) → Supabase (V1 admin) | Decision before Phase 6 |
| Analytics | GA4 | Custom events via gtag |
| Fonts | Space Grotesk (Google Fonts) | Bold for headings, Regular for body |

## Design Tokens

```
Background:   #0a0a0a
Accent:       #D4820A  (amber — active states, progress, play buttons)
Typeface:     Space Grotesk
```

## Route Map

```
/                          → Library (homepage) — song list
/about                     → About Kai
/songs/[slug]              → Song profile page
/admin                     → Admin dashboard (password-protected)
/admin/login               → Admin login
```

## Data Model (Song)

```ts
type Song = {
  id:          string;
  slug:        string;           // auto-generated from title
  title:       string;
  description: string;           // one-line, for library listing
  mp3Url:      string;           // R2 public URL
  coverArtUrl: string;           // R2 public URL
  lyrics:      string;           // full lyrics, markdown-safe
  explanation?: string;          // optional; omit to hide section
  published:   boolean;
  createdAt:   string;           // ISO 8601
}
```

## Component Map

```
/components
  /player
    MiniPlayer.tsx         — persistent bottom bar, shown once song plays
    FullscreenPlayer.tsx   — full-screen overlay triggered from MiniPlayer tap
    PlayerContext.tsx      — global player state (current song, play/pause, progress)
  /library
    SongCard.tsx           — cover art + title + description row
  /song
    LyricsPanel.tsx        — collapsible lyrics section
    ExplanationPanel.tsx   — optional; only renders if explanation exists
  /layout
    BottomNav.tsx          — Library / About navigation tabs
    PageShell.tsx          — root layout with bottom nav + player offset
```

## Analytics Events (GA4)

| Event | Parameters |
|---|---|
| `song_play` | `song_title`, `song_slug` |
| `song_complete` | `song_title`, `song_slug` |
| `song_page_view` | `song_title`, `song_slug` |
| `explanation_viewed` | `song_title`, `song_slug` |
| `lyrics_viewed` | `song_title`, `song_slug` |

## Security

- Admin auth: single password via `ADMIN_PASSWORD` env var (no public signup)
- No user PII collected or stored
- R2 credentials injected via Vercel env vars only — never in client bundle
- R2 upload API route validates `Content-Type` and file size on server

## Phase Plan

| Phase | Scope |
|---|---|
| 1 | Scaffold + design system |
| 2 | Library page (static data) |
| 3 | Song page (static data) |
| 4 | About page |
| 5 | Persistent player (mini + fullscreen) |
| 6 | Admin dashboard + DB decision |
| 7 | R2 upload integration |
| 8 | GA4 integration |
| 9 | Production hardening + deploy |
