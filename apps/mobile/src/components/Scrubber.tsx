import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { formatTime } from "@beatsbykai/core";
import AppText from "./AppText";
import { colors, space } from "@/theme";

/**
 * Port of the web's pointer-capture scrubber.
 *
 * `scrubProgress` is local optimistic state: while dragging, the thumb
 * follows the finger rather than the engine, so it does not fight the 4Hz
 * status updates. The seek is committed once, on release.
 */
export default function Scrubber({
  progress,
  duration,
  enabled,
  onSeek,
}: {
  /** 0..1 fraction. */
  progress: number;
  /** Seconds. */
  duration: number;
  enabled: boolean;
  onSeek: (progress: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const [scrubProgress, setScrubProgress] = useState<number | null>(null);

  const toProgress = (x: number) => {
    if (width <= 0) return 0;
    return Math.max(0, Math.min(1, x / width));
  };

  const pan = Gesture.Pan()
    .enabled(enabled)
    .minDistance(0)
    .onBegin((e) => runOnJS(setScrubProgress)(toProgress(e.x)))
    .onUpdate((e) => runOnJS(setScrubProgress)(toProgress(e.x)))
    .onFinalize((e) => {
      const p = toProgress(e.x);
      runOnJS(setScrubProgress)(null);
      runOnJS(onSeek)(p);
    });

  const shown = scrubProgress ?? progress;
  const position = shown * duration;

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={pan}>
        <View
          style={styles.hitArea}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          accessibilityRole="adjustable"
          accessibilityLabel="Song progress"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(shown * 100) }}
        >
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${shown * 100}%` }]}>
              <View style={styles.thumb} />
            </View>
          </View>
        </View>
      </GestureDetector>

      <View style={styles.times}>
        <AppText variant="caption" color="rgba(240,240,240,0.25)">
          {formatTime(position)}
        </AppText>
        <AppText variant="caption" color="rgba(240,240,240,0.25)">
          {formatTime(duration)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.page },
  hitArea: { paddingVertical: space.md },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  thumb: {
    position: "absolute",
    right: -8,
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  times: { flexDirection: "row", justifyContent: "space-between", marginTop: -4 },
});
