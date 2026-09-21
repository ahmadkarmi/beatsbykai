// GA4 event tracking via gtag.
// All functions safely no-op when gtag is unavailable (SSR, GA not loaded).

import type { SongLabel, RepeatMode } from "@/lib/types";

export type PlaySource =
  | "library_featured"
  | "library_grid"
  | "song_list"
  | "song_page"
  | "auto_advance"
  | "next_button"
  | "prev_button";

declare global {
  var gtag: ((command: string, eventName: string, params?: Record<string, string>) => void) | undefined;
}

function track(event: string, params: Record<string, string> = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", event, params);
  }
}

// ─── Playback ────────────────────────────────────────────────────────────────

export function trackSongPlay(
  title: string,
  slug: string,
  labels: SongLabel[] = [],
  source: PlaySource = "song_page"
) {
  track("song_play", {
    song_title: title,
    song_slug: slug,
    play_source: source,
    ...(labels.length > 0 && { song_labels: labels.join(",") }),
  });
}

/** Fires at 25, 50, 75% — each milestone fires once per song load. */
export function trackSongMilestone(title: string, slug: string, milestone: 25 | 50 | 75) {
  track("song_milestone", {
    song_title: title,
    song_slug: slug,
    milestone: `${milestone}pct`,
  });
}

export function trackSongComplete(title: string, slug: string) {
  track("song_complete", { song_title: title, song_slug: slug });
}

export function trackSongSkipped(title: string, slug: string, progress_pct: string) {
  track("song_skipped", { song_title: title, song_slug: slug, progress_pct });
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export function trackNextTrack(from_title: string, from_slug: string, source: "next_button" | "auto_advance") {
  track("next_track", { from_title, from_slug, source });
}

export function trackPrevTrack(from_title: string, from_slug: string, action: "prev_song" | "restart") {
  track("prev_track", { from_title, from_slug, action });
}

// ─── Player controls ─────────────────────────────────────────────────────────

export function trackSongSeeked(title: string, slug: string, from_pct: string, to_pct: string) {
  track("song_seeked", { song_title: title, song_slug: slug, from_pct, to_pct });
}

export function trackShuffleToggled(enabled: boolean) {
  track("shuffle_toggled", { enabled: String(enabled) });
}

export function trackRepeatChanged(mode: RepeatMode) {
  track("repeat_changed", { mode });
}

export function trackMiniPlayerTap(title: string, slug: string) {
  track("mini_player_tap", { song_title: title, song_slug: slug });
}

// ─── Content engagement ──────────────────────────────────────────────────────

export function trackSongPageView(title: string, slug: string) {
  track("song_page_view", { song_title: title, song_slug: slug });
}

export function trackSectionToggled(
  section: "lyrics" | "explanation",
  action: "open" | "close",
  title: string,
  slug: string
) {
  track("section_toggled", { section, action, song_title: title, song_slug: slug });
}

export function trackSongShared(
  title: string,
  slug: string,
  method: "native" | "clipboard"
) {
  track("song_shared", { song_title: title, song_slug: slug, method });
}
