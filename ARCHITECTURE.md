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
| Image encoding | `sharp` | Only used to re-encode the OG card to JPEG; see Social Sharing. |
| Fonts | Space Grotesk via `next/font/google` | 400 + 700. Raw TTFs are also vendored in `public/fonts/` for OG rendering. |

Runtime dependencies are deliberately minimal: `next`, `react`, `react-dom`,
`@vercel/speed-insights`, `sharp`. No state library, no audio library, no UI kit, no form
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
across `LibraryView`, `MiniPlayer`, `SongPageClient` and `SongForm`
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
  /tags/[tag]                         Songs by theme — ISR 60; see Findability

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
    PlayerContext.tsx  (451) global player state: current song, queue,
                             shuffle/repeat, progress. Owns the single HTML5
                             Audio element and the Media Session bindings.
    MiniPlayer.tsx     (114) persistent bar above BottomNav. Hidden on
                             /songs/* — the full player is already on screen.
  /library
    LibraryView.tsx    (414) home screen: hero, featured song, track list.
                             Seeds the player queue via setQueue() on mount.
                             Holds its own mobile and desktop row components.
  /song
    SongPageClient.tsx (456) full-screen player: cover hero, scrubber,
                             transport, section tabs.
    SongSections.tsx    (83) the lyrics / "Kai Says" bottom sheet, the shared
                             section body, and the UI -> analytics name map.
    ShareButton.tsx     (99) native share sheet with clipboard fallback.
    icons.tsx           (88) transport and chrome icons.
  /layout
    BottomNav.tsx      (142) Library / About tabs, plus a third "Playing" tab
                             that animates in once a song with audio is loaded.
    MainContent.tsx     (19) <main> wrapper; bottom padding tracks whether the
                             MiniPlayer is present (pb-14 -> pb-[7.5rem]).
    NavigationProgress  (79) top progress bar driven by pathname changes.
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

Every file is within the 500 LOC ceiling in `CLAUDE.md`.

`PlayerContext` writes its stale-closure mirror refs (`currentSongRef`,
`queueRef`, `shuffledQueueRef`, `shuffleRef`, `repeatRef`, `playRef`) from an
effect, never during render. Every reader is an async callback that runs after
commit, so this is soon enough, and render-phase ref writes break under
StrictMode's double render. Keep new refs on the same pattern.

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

The UI calls the "Kai Says" panel `kaisays`; the taxonomy calls it
`explanation`. `sectionEventName()` in `SongSections.tsx` is the single place
that maps between them — do not change the event parameter to match the UI.

Media Session handlers route through `resume` / `pause` / `playNext` /
`playPrevious` / `seekTo` rather than driving the audio element directly, so
lock-screen, headset and car controls honour shuffle and repeat and emit the
same events as the on-screen transport.

## Social Sharing

Share is link-based: the native sheet hands over the canonical song URL, and
the receiving app renders the Open Graph card. Nothing is uploaded or
rasterised client-side.

| Piece | File | Notes |
|---|---|---|
| Share control | `components/song/ShareButton.tsx` | `navigator.share({ title, url })`, falling back to `navigator.clipboard` with a transient "Link copied" state. A dismissed sheet (`AbortError`) is not counted as a share. |
| Card renderer | `app/songs/[slug]/opengraph-image.tsx` | `next/og` (Satori) -> re-encoded to 1200x630 JPEG: the square cover at full card height on the left, wordmark / title / rule / description on the right. |
| Fonts | `public/fonts/SpaceGrotesk-{Regular,Bold}.ttf` | Satori needs raw font bytes; `next/font` does not expose them. |

Constraints worth knowing before editing the card:

- **No `text` in the share payload.** Including one makes iMessage fall back to
  plain text instead of unfurling the card.
- **`app/songs/[slug]/page.tsx` must not set `openGraph.images`.** An explicit
  value overrides the `opengraph-image.tsx` file convention and resurfaces the
  raw 1:1 cover, which unfurls centre-cropped.
- **The card must stay under ~300KB or WhatsApp drops it** and shows a
  text-only preview. `next/og` can only emit PNG, and a 1200x630 PNG of
  photographic cover art is 750KB-1MB (vercel/next.js#60366), so the route
  re-encodes to JPEG with `sharp` before returning — roughly 1MB down to
  130KB. This is why the route returns a plain `Response` rather than the
  `ImageResponse` directly, and why `sharp` is a declared dependency.
- **The cover is never cropped.** It renders at 630x630 — the full height of
  the card — so the whole square is visible. Covers are composed full frame,
  and a full-bleed 1200x630 treatment cuts roughly 47% of the artwork; on
  `1984` that removes the boy and the bird entirely.
- **Title size steps down with length** (`titleSize()`). The text panel is only
  ~446px of usable width, so the longest titles in the catalogue would
  otherwise wrap into a three-line stack.
- Because nothing is overlaid on the art, bright and dark covers both work
  without a scrim to balance. If you ever reintroduce an overlay, note that
  Satori ignores the `inset` shorthand — absolute overlays need explicit
  `top` / `left` / `width` / `height` or they silently do not paint.
- The route is dynamic with `revalidate = 60`. The `/api/revalidate` webhook
  targets the page route, not the image route, so a changed cover reaches the
  card within ~60s rather than instantly.

## Findability

Kai is **deliberately website-only** — not on Spotify, Apple Music, YouTube or
TikTok. That is a product decision, but it means `sameAs` carries almost no
entity signal and the site has to earn all of its discovery through its own
pages. SEO here is not a nice-to-have.

**Structured data.** `MusicGroup` / `Organization` / `WebSite` on the home
page; `MusicRecording` + `BreadcrumbList` per song, including full `lyrics`
and `inLanguage`; `CollectionPage` + `ItemList` per tag. All serialised
through `lib/jsonld.ts`.

**Dates.** The Worker returns `createdAt` as `"2026-04-12 15:20:08"`, which is
not ISO 8601 and which `new Date()` parses in an implementation-defined way.
`lib/dates.ts` normalises it (as UTC) before it reaches `datePublished` or the
sitemap.

**Tag pages** turn otherwise-dead metadata into browsable, indexable surfaces
and give a listener a reason to play a second song. Policy in `lib/tags.ts`:

- Every tag is clickable and every tag page renders.
- Only tags with **2 or more songs** are indexed and listed in the sitemap.
  A one-song tag page is a near-duplicate of the song page — thin content —
  so it is served `noindex, follow`.
- The "other themes" footer nav shows only indexable tags, capped at 12.

**Measurement.** GA4 (`NEXT_PUBLIC_GA_ID`) covers on-site behaviour and
acquisition source. It cannot show search impressions, queries or position —
that needs Google Search Console, wired via `GOOGLE_SITE_VERIFICATION`.

### Known issue: soft 404s on dynamic params

An unknown dynamic param returns **200 with the not-found body** rather than a
404 — e.g. `/songs/does-not-exist`. A genuinely unknown route (`/made-up`)
404s correctly. Cause: `notFound()` inside a route with
`generateStaticParams` + `revalidate` is prerendered and served from cache
with a 200 (`X-Nextjs-Prerender: 1`).

Low exposure today: nothing links to invalid URLs and the sitemap is clean.
It matters when a song is **deleted or renamed** — the old URL then 200s
forever and stays indexed.

`export const dynamicParams = false` would fix it, but breaks publishing: a
song added through the control panel would 404 until the next deploy, because
the param list is fixed at build time. Needs a better answer before changing.

## Security

**Public surface.** No accounts, no signup, no login, no user-submitted
content, no public forms. No PII is collected or stored. There is no
client-side persistence at all — player state is lost on reload.

**Server Actions are public endpoints.** A Server Action POSTs to whatever
path the caller is on, and its id ships in public client chunks under
`/_next/static`. `proxy.ts` therefore *cannot* protect them: an
unauthenticated POST to `/` never matches its `/controlpanel` matcher. Every
mutating action in `lib/admin/actions.ts` calls `requireAdmin()`
(`lib/admin/guard.ts`) as its first statement. **Any new admin action must do
the same** — the proxy is defence in depth only.

**Admin auth.** A single shared password in `ADMIN_PASSWORD`, compared in
constant time (`lib/safe-equal.ts`). On success the server sets an httpOnly
`admin_session` cookie holding an HMAC-signed expiry — *not* a secret
(`lib/admin/session.ts`). The signing key is `WORKER_ADMIN_SECRET`, which
never leaves the server. Failed logins are counted per IP and every rejection
carries a fixed delay (`lib/admin/rate-limit.ts`); that store is per-instance
in-memory, so it is a speed bump rather than a hard limit — making it
authoritative needs a shared store.

**Secrets.** `WORKER_URL`, `WORKER_ADMIN_SECRET`, `REVALIDATE_SECRET` and
`ADMIN_PASSWORD` are server-only. Only `NEXT_PUBLIC_*` values reach the client
bundle. No R2 credentials exist in this app — it never calls R2's API.

**Headers** (`next.config.ts`): CSP, `X-Frame-Options: DENY`,
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` on every
route, plus `X-Robots-Tag: noindex` on `/controlpanel/*`. `script-src` still
needs `'unsafe-inline'` for Next's hydration scripts and the GA snippet;
tightening it requires per-request nonces and running the proxy on every
route.

**Injection.** React escapes everything except the two JSON-LD blocks, which
go through `lib/jsonld.ts` — `JSON.stringify` does not escape `<`, so an
operator-supplied title containing `</script>` would otherwise break out.

**Uploads.** There is no upload route in this app. `SongForm` asks a Server
Action for a short-lived token (the server fetches
`GET /songs/{slug}/upload-token` with the admin bearer), then the browser
`POST`s the file bytes straight to the Worker with that token. File-type and
size validation therefore live **in the Worker**, not here.

**Outbound fetch.** The OG card route fetches `coverArtUrl`, which is
operator-supplied data, so it is pinned to the media host to avoid SSRF.

**Revalidation.** `/api/revalidate` compares `x-revalidate-secret` in constant
time and returns 401 otherwise.

### Known, unfixed

- **The R2 bucket is public and unsigned**, so an unpublished song's audio and
  artwork are world-readable by URL before release — only the timestamped
  filename obscures them. It is also served from a `*.r2.dev` hostname, which
  Cloudflare rate-limits and documents as development-only. Both live in the
  Worker/R2 configuration, outside this repo.

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
