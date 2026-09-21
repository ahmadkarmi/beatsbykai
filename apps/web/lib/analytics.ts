// GA4 binding for the shared analytics taxonomy. Event names and parameter
// keys live in @beatsbykai/core so web and mobile cannot drift apart.

import { createAnalytics, type AnalyticsSink } from "@beatsbykai/core";

declare global {
  var gtag:
    | ((command: string, eventName: string, params?: Record<string, string>) => void)
    | undefined;
}

/** No-ops during SSR, when GA is not configured, and when a blocker removes it. */
const gtagSink: AnalyticsSink = {
  track(event, params) {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", event, params);
    }
  },
};

export const {
  trackSongPlay,
  trackSongMilestone,
  trackSongComplete,
  trackSongSkipped,
  trackNextTrack,
  trackPrevTrack,
  trackSongSeeked,
  trackShuffleToggled,
  trackRepeatChanged,
  trackMiniPlayerTap,
  trackSongPageView,
  trackSectionToggled,
  trackSongShared,
} = createAnalytics(gtagSink);

export type { PlaySource } from "@beatsbykai/core";
