import { createAnalytics, noopSink, type AnalyticsSink } from "@beatsbykai/core";

// Event names and parameter keys are defined once in @beatsbykai/core, so
// web and mobile cannot drift. This file only supplies the destination.
//
// Firebase lands in slice 8. Until then events are logged in development —
// which is exactly what slice 5's on-device checklist needs, since verifying
// "song_skipped fired at ~40%" otherwise means guessing.

const devSink: AnalyticsSink = {
  track(event, params) {
    console.log(`[analytics] ${event}`, params);
  },
};

export const analytics = createAnalytics(__DEV__ ? devSink : noopSink);
