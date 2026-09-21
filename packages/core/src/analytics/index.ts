import type { RepeatMode, SongLabel } from "../types";

// One definition of the event taxonomy for every platform. Web supplies a
// gtag sink, mobile will supply a Firebase sink; neither can drift, because
// neither owns the event names or parameter keys.

export type PlaySource =
  | "library_featured"
  | "library_grid"
  | "song_list"
  | "song_page"
  | "auto_advance"
  | "next_button"
  | "prev_button";

export type AnalyticsSink = {
  track(event: string, params: Record<string, string>): void;
};

/** Discards everything. Used during SSR and before a sink is configured. */
export const noopSink: AnalyticsSink = { track: () => {} };

export function createAnalytics(sink: AnalyticsSink) {
  const track = (event: string, params: Record<string, string> = {}) =>
    sink.track(event, params);

  return {
    // ── Playback ──
    trackSongPlay(
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
    },

    /** 25, 50, 75 — each fires once per song load. */
    trackSongMilestone(title: string, slug: string, milestone: 25 | 50 | 75) {
      track("song_milestone", {
        song_title: title,
        song_slug: slug,
        milestone: `${milestone}pct`,
      });
    },

    trackSongComplete(title: string, slug: string) {
      track("song_complete", { song_title: title, song_slug: slug });
    },

    trackSongSkipped(title: string, slug: string, progress_pct: string) {
      track("song_skipped", { song_title: title, song_slug: slug, progress_pct });
    },

    // ── Navigation ──
    trackNextTrack(
      from_title: string,
      from_slug: string,
      source: "next_button" | "auto_advance"
    ) {
      track("next_track", { from_title, from_slug, source });
    },

    trackPrevTrack(
      from_title: string,
      from_slug: string,
      action: "prev_song" | "restart"
    ) {
      track("prev_track", { from_title, from_slug, action });
    },

    // ── Player controls ──
    trackSongSeeked(title: string, slug: string, from_pct: string, to_pct: string) {
      track("song_seeked", { song_title: title, song_slug: slug, from_pct, to_pct });
    },

    trackShuffleToggled(enabled: boolean) {
      track("shuffle_toggled", { enabled: String(enabled) });
    },

    trackRepeatChanged(mode: RepeatMode) {
      track("repeat_changed", { mode });
    },

    trackMiniPlayerTap(title: string, slug: string) {
      track("mini_player_tap", { song_title: title, song_slug: slug });
    },

    // ── Content engagement ──
    trackSongPageView(title: string, slug: string) {
      track("song_page_view", { song_title: title, song_slug: slug });
    },

    trackSectionToggled(
      section: "lyrics" | "explanation",
      action: "open" | "close",
      title: string,
      slug: string
    ) {
      track("section_toggled", { section, action, song_title: title, song_slug: slug });
    },

    trackSongShared(title: string, slug: string, method: "native" | "clipboard") {
      track("song_shared", { song_title: title, song_slug: slug, method });
    },
  };
}

export type Analytics = ReturnType<typeof createAnalytics>;
