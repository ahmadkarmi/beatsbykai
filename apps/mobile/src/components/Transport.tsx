import { ActivityIndicator, Pressable, View, StyleSheet } from "react-native";
import type { RepeatMode } from "@beatsbykai/core";
import {
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
} from "./icons";
import { colors, space } from "@/theme";

export default function Transport({
  isPlaying,
  isLoading,
  disabled,
  shuffle,
  repeat,
  hasPrevious,
  hasNext,
  title,
  onPlayPause,
  onPrevious,
  onNext,
  onToggleShuffle,
  onCycleRepeat,
}: {
  isPlaying: boolean;
  isLoading: boolean;
  disabled: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  hasPrevious: boolean;
  hasNext: boolean;
  title: string;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
}) {
  const muted = "rgba(255,255,255,0.3)";
  const inactive = "rgba(255,255,255,0.15)";

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onToggleShuffle}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={shuffle ? "Shuffle on" : "Shuffle off"}
        style={styles.side}
      >
        <ShuffleIcon color={shuffle ? colors.accent : muted} />
        {shuffle && <View style={styles.dot} />}
      </Pressable>

      <Pressable
        onPress={onPrevious}
        disabled={!hasPrevious}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Previous track"
        style={styles.side}
      >
        <PreviousIcon color={hasPrevious ? "rgba(255,255,255,0.6)" : inactive} />
      </Pressable>

      <Pressable
        onPress={disabled ? undefined : onPlayPause}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? `Pause ${title}` : `Play ${title}`}
        style={({ pressed }) => [
          styles.playButton,
          disabled && styles.playDisabled,
          pressed && !disabled && styles.playPressed,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : isPlaying ? (
          <PauseIcon size={26} />
        ) : (
          <PlayIcon size={26} />
        )}
      </Pressable>

      <Pressable
        onPress={onNext}
        disabled={!hasNext && repeat === "off"}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Next track"
        style={styles.side}
      >
        <NextIcon color={hasNext || repeat === "all" ? "rgba(255,255,255,0.6)" : inactive} />
      </Pressable>

      <Pressable
        onPress={onCycleRepeat}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Repeat: ${repeat}`}
        style={styles.side}
      >
        {repeat === "one" ? (
          <RepeatOneIcon color={colors.accent} />
        ) : (
          <RepeatIcon color={repeat === "all" ? colors.accent : muted} />
        )}
        {repeat !== "off" && <View style={styles.dot} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.page,
    paddingVertical: space.lg,
  },
  side: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  dot: {
    position: "absolute",
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    // Android cannot tint elevation, so the web's amber glow reads as a
    // neutral shadow there. iOS gets the coloured version.
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  playDisabled: {
    backgroundColor: "rgba(255,255,255,0.08)",
    shadowOpacity: 0,
    elevation: 0,
  },
  playPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
