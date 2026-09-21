# Kai Web App — Architecture

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16.2.3 (App Router) | Server Components; `proxy.ts` is Next 16's renamed middleware |
| UI | React 19.2.4 | |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS v4 | Tokens live in an `@theme` block in `app/globals.css`. There is no `tailwind.config.js`. |
| Hosting | Vercel | CI/CD via GitHub |
| Content API | Cloudflare Worker (separate repo) | REST; the only data source. This app has no database and no ORM. |
| Media storage | Cloudflare R2 | MP3s + cover art, served from a public bucket |
| Analytics | GA4 via raw `gtag` + `@vercel/speed-insights` | No analytics SDK; see `lib/analytics.ts` |
| Fonts | Space Grotesk via `next/font/google` | 400 + 700. Raw TTFs are also vendored in `public/fonts/` for OG rendering. |

Runtime dependencies are deliberately minimal: `next`, `react`, `react-dom`,
`@vercel/speed-insights`. No state library, no audio library, no UI kit, no form
library, no fetch client. Every icon is hand-written inline SVG.

## Design Tokens

Source of truth is the `@theme` block in `app/globals.css`.

```
Public palette
  --color-background   #0a0a0a      --color-text         #f0f0f0
  --color-surface      #111111      --color-muted        #7a7a7a
  --color-surface-2    #1a1a1a      --color-accent       #d4820a  (brand amber)
  --color-border       #242424      --color-accent-hover #e8970c
  --color-glass        rgba(10,10,10,0.88)

Control panel — deliberately distinct so admin never looks like the site
  --color-cp-bg        #0d0f14      --color-cp-accent    #6366f1
  --color-cp-surface   #12151c      --color-cp-text      #e8eaf0
  --color-cp-border    #1e2433      --color-cp-muted     #64748b

--font-sans: var(--font-space-grotesk), system-ui, sans-serif
```

Song label colours are **not** tokens — they are Tailwind classes duplicated
across `LibraryView`, `MiniPlayer`, `SongPageClient`, `SongCard` and `SongForm`
(`new` = emerald, `trending` = amber, `featured` = violet), with slightly
different alpha values between copies.

Animations defined in `globals.css`: `eq-bar`, `fade-up`, `fade-in`,
`slide-up`, `scroll-cascade`.

## Route Map

```
Public
  /                                   Library (home) — ISR, revalidate 60
  /about                              About Kai — static
  /songs/[slug]                       Song page — ISR 60, generateStaticParams

Admin — gated by proxy.ts, noindex
  /controlpanel                       Dashboard (stats + reorder), dynamic
  /controlpanel/login                 Password form
  /controlpanel/songs/new             Create
  /controlpanel/songs/[slug]          Edit

Machine-readable
  /api/revalidate                     POST webhook, called by the Worker
  /sitemap.xml   /robots.txt
  /icon.png   /apple-icon.png   /favicon.ico
  /opengraph-image                    Site-wide OG card
  /songs/[slug]/opengraph-image       Per-song OG card (see Social Sharing)

Legacy
  /admin, /admin/*                    redirect -> /
```

## Data Model (Song)

Defined in `lib/types.ts`. Supplied by the Worker; this app never writes it
directly. There is no album or release entity.

```ts
type SongLabel = "new" | "trending" | "featured";

type Song = {
  id:          string;      // uuid
  slug:        string;      // generated from title, immutable after create
  title:       string;
  description: string;      // one-line; used in listings and OG cards
  mp3Url:      string;      // R2 public URL
  coverArtUrl: string;      // R2 public URL, square (1024x1024)
  lyrics:      string;
  explanation?: string;     // optional; surfaced in the UI as "Kai Says"
  labels:      SongLabel[];
  tags:        string[];    // free-form, "#"-prefixed
  published:   boolean;
  createdAt:   string;
}
```

`lib/admin/api.ts` extends this as `AdminSong` with `mp3Key` and `coverKey`
(R2 object keys, needed to replace files on edit).

Notes:

- **No duration field.** Track length is discovered client-side from the audio
  element, so it is unknown until a track loads.
- **Ordering is server-controlled** via admin drag-reorder. Never re-sort
  client-side.
- "Featured" is derived, not stored: the first song labelled `featured`, else
  `songs[0]`.

### Worker endpoints

| Method | Path | Auth | Used by |
|---|---|---|---|
| GET | `/songs` | public | `lib/data/songs.ts` |
| GET | `/songs/{slug}` | public | `lib/data/songs.ts` |
| GET | `/admin/songs` | Bearer | dashboard (includes drafts) |
| POST | `/songs` | Bearer | create |
| PUT | `/songs/{slug}` | Bearer | update |
| DELETE | `/songs/{slug}` | Bearer | delete |
| PUT | `/admin/songs/reorder` | Bearer | `{ slugs: string[] }` |
| GET | `/songs/{slug}/upload-token` | Bearer | issues a short-lived upload token |
| POST | `/songs/{slug}/upload` | token | direct browser upload (`type=mp3` or `cover`) |

Public reads use a 5s `AbortController` timeout and degrade to `[]` /
`undefined` on any failure, so the library renders empty rather than erroring.

## Component Map

Public app. Every file below is a client component; the server components are
the route files under `app/`.

```
/components
  Providers.tsx              client root — wraps the app in PlayerProvider and
                             renders the persistent shell (see order below)
  /player
    PlayerContext.tsx  (442) global player state: current song, queue,
                             shuffle/repeat, progress. Owns the single HTML5
                             Audio element and the Media Session bindings.
    MiniPlayer.tsx     (114) persistent bar above BottomNav. Hidden on
                             /songs/* — the full player is already on screen.
  /library
    LibraryView.tsx    (414) home screen: hero, featured song, track list.
                             Seeds the player queue via setQueue() on mount.
                             Holds its own mobile and desktop row components.
    SongCard.tsx       (128) UNUSED — see Known Issues.
  /song
    SongPageClient.tsx (568) full-screen player: cover hero, scrubber,
                             transport, lyrics / "Kai Says" panels.
    ShareButton.tsx     (99) native share sheet with clipboard fallback.
  /layout
    BottomNav.tsx      (142) Library / About tabs, plus a third "Playing" tab
                             that animates in once a song with audio is loaded.
    MainContent.tsx     (19) <main> wrapper; bottom padding tracks whether the
                             MiniPlayer is present (pb-14 -> pb-[7.5rem]).
    NavigationProgress  (67) top progress bar driven by pathname changes.
    PageTransition.tsx  (12) fade-in keyed on pathname.

/app/controlpanel/_components     admin only — behind the proxy.ts auth gate
  SongForm.tsx         (384) create / edit, with direct-to-Worker file upload
  ReorderList.tsx      (126) drag ordering + publish toggle
  LoginForm.tsx         (52)
  DeleteSongButton.tsx  (18)
```

Shell composition, from `Providers.tsx`:

```
PlayerProvider
  NavigationProgress
  MainContent > PageTransition > {page}
  MiniPlayer
  BottomNav
```

### Known Issues

- `components/library/SongCard.tsx` is dead code — nothing imports it.
  `LibraryView` defines its own row components inline. Safe to delete.
- `components/song/SongPageClient.tsx` is 568 LOC, over the 500 LOC ceiling in
  `CLAUDE.md`. The lyrics / "Kai Says" panels and the icon set are the natural
  extractions.

## Analytics Events (GA4)

All events funnel through `lib/analytics.ts`, which no-ops when `window.gtag`
is absent (SSR, GA blocked, GA not configured).

| Event | Parameters |
|---|---|
| `song_play` | `song_title`, `song_slug`, `play_source`, `song_labels` (when present) |
| `song_milestone` | `song_title`, `song_slug`, `milestone` (`25pct` \| `50pct` \| `75pct`) |
| `song_complete` | `song_title`, `song_slug` |
| `song_skipped` | `song_title`, `song_slug`, `progress_pct` |
| `next_track` | `from_title`, `from_slug`, `source` (`next_button` \| `auto_advance`) |
| `prev_track` | `from_title`, `from_slug`, `action` (`prev_song` \| `restart`) |
| `song_seeked` | `song_title`, `song_slug`, `from_pct`, `to_pct` |
| `shuffle_toggled` | `enabled` |
| `repeat_changed` | `mode` (`off` \| `all` \| `one`) |
| `mini_player_tap` | `song_title`, `song_slug` |
| `song_page_view` | `song_title`, `song_slug` |
| `section_toggled` | `section` (`lyrics` \| `explanation`), `action`, `song_title`, `song_slug` |
| `song_shared` | `song_title`, `song_slug`, `method` (`native` \| `clipboard`) |

`play_source` is one of `library_featured`, `library_grid`, `song_list`,
`song_page`, `auto_advance`, `next_button`, `prev_button`.

Known gaps:

- **`section_toggled` never fires.** `trackSectionToggled` is exported but no
  component calls it, so lyrics / "Kai Says" engagement is unmeasured.
- Lock-screen and Bluetooth `nexttrack` / `previoustrack` go straight to the
  Media Session handlers in `PlayerContext`, bypassing `playNext()` /
  `playPrevious()`, so remote skips emit no `next_track` / `prev_track`.

## Social Sharing

Share is link-based: the native sheet hands over the canonical song URL, and
the receiving app renders the Open Graph card. Nothing is uploaded or
rasterised client-side.

| Piece | File | Notes |
|---|---|---|
| Share control | `components/song/ShareButton.tsx` | `navigator.share({ title, url })`, falling back to `navigator.clipboard` with a transient "Link copied" state. A dismissed sheet (`AbortError`) is not counted as a share. |
| Card renderer | `app/songs/[slug]/opengraph-image.tsx` | `next/og` (Satori) -> 1200x630 PNG: blurred cover backdrop, sharp cover, title, description, wordmark. |
| Fonts | `public/fonts/SpaceGrotesk-{Regular,Bold}.ttf` | Satori needs raw font bytes; `next/font` does not expose them. |

Constraints worth knowing before editing the card:

- **No `text` in the share payload.** Including one makes iMessage fall back to
  plain text instead of unfurling the card.
- **`app/songs/[slug]/page.tsx` must not set `openGraph.images`.** An explicit
  value overrides the `opengraph-image.tsx` file convention and resurfaces the
  raw 1:1 cover, which unfurls centre-cropped.
- **Satori ignores the `inset` shorthand.** Absolute overlays need explicit
  `top` / `left` / `width` / `height` or they silently do not paint.
- **Blur fringing** (vercel/satori#309) is avoided by rendering the backdrop at
  1800px so its edges fall outside the 1200x630 crop.
- Bright and dark covers are normalised with `brightness()` inside the filter
  chain rather than a heavier scrim, so the backdrop stays visible on both.
- The route is dynamic with `revalidate = 60`. The `/api/revalidate` webhook
  targets the page route, not the image route, so a changed cover reaches the
  card within ~60s rather than instantly.

## Security

**Public surface.** No accounts, no signup, no login, no user-submitted
content, no public forms. No PII is collected or stored. There is no
client-side persistence at all — player state is lost on reload.

**Admin auth.** A single shared password in `ADMIN_PASSWORD`. On success
`loginAction` sets an httpOnly cookie `admin_token` (`sameSite: lax`, `secure`
in production, 7-day `maxAge`), and `proxy.ts` gates `/controlpanel/*` by
comparing that cookie to `WORKER_ADMIN_SECRET`.

> The cookie's **value is `WORKER_ADMIN_SECRET` itself**, so the Worker's admin
> secret is held in the browser. `httpOnly` keeps it away from JavaScript, but
> it is sent on every request to the origin, and rotating the secret signs out
> every admin session. Issuing a random session token and mapping it to the
> secret server-side would decouple the two. Accepted for a single-operator
> admin; revisit if more operators are added.

**Secrets.** `WORKER_URL`, `WORKER_ADMIN_SECRET`, `REVALIDATE_SECRET` and
`ADMIN_PASSWORD` are server-only. Only `NEXT_PUBLIC_*` values reach the client
bundle. No R2 credentials exist in this app — it never calls R2's API.

**Uploads.** There is no upload route in this app. `SongForm` asks a Server
Action for a short-lived token (the server fetches
`GET /songs/{slug}/upload-token` with the admin bearer), then the browser
`POST`s the file bytes straight to the Worker with that token. File-type and
size validation therefore live **in the Worker**, not here.

**Media.** The R2 bucket is public and URLs are unsigned, so any uploaded
object is world-readable by URL. It is served from a `*.r2.dev` hostname, which
Cloudflare rate-limits and documents as development-only; a custom domain is
the supported production path.

**Revalidation.** `/api/revalidate` requires the `x-revalidate-secret` header
to match `REVALIDATE_SECRET`, and returns 401 otherwise.

## Phase Plan

Historical — all nine phases shipped. Retained for context on how the build was
sequenced. Two things landed differently from the original plan:

- Phase 6's "DB decision" resolved to a **Cloudflare Worker + R2**, not
  Supabase. This app holds no database.
- The admin dashboard lives at **`/controlpanel`**, not `/admin`.

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
