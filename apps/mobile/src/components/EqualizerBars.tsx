import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// Port of the web's `eq-bar` keyframe: 0.75s cycle, scaleY 0.25 -> 1, bars
// staggered by 0.18s. transformOrigin is supported in RN 0.86, so the bars
// grow upward from the baseline exactly as on web.
const DURATION = 375;
const STAGGER = 180;
const PAUSED_SCALE = [0.35, 0.7, 0.5];

function Bar({ index, playing, color }: { index: number; playing: boolean; color: string }) {
  const scale = useSharedValue(PAUSED_SCALE[index]);

  useEffect(() => {
    if (playing) {
      scale.value = withDelay(
        index * STAGGER,
        withRepeat(withTiming(1, { duration: DURATION }), -1, true)
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(PAUSED_SCALE[index], { duration: 200 });
    }
    return () => cancelAnimation(scale);
  }, [playing, index, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: scale.value }] }));

  return <Animated.View style={[styles.bar, { backgroundColor: color }, style]} />;
}

export default function EqualizerBars({
  playing,
  color,
}: {
  playing: boolean;
  color: string;
}) {
  return (
    <View style={styles.row}>
      {[0, 1, 2].map((i) => (
        <Bar key={i} index={i} playing={playing} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 14 },
  bar: { width: 3, height: 14, borderRadius: 1, transformOrigin: "bottom" },
});
