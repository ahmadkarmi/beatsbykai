import { memo } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { Song } from "@beatsbykai/core";
import AppText from "./AppText";
import LabelChip from "./LabelChip";
import { colors, radius, space } from "@/theme";

/**
 * memo matters here: once the player lands, its context ticks four times a
 * second and every row would otherwise re-render with it. Rows depend on the
 * song and on whether they are the active one — never on progress.
 */
function TrackRow({
  song,
  index,
  active = false,
  onPress,
}: {
  song: Song;
  index: number;
  active?: boolean;
  onPress: (song: Song) => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(120 + index * 40).duration(350)}>
      <Pressable
        onPress={() => onPress(song)}
        accessibilityRole="button"
        accessibilityLabel={song.title}
        style={({ pressed }) => [
          styles.row,
          active && styles.rowActive,
          pressed && styles.rowPressed,
        ]}
      >
        <View style={styles.cover}>
          {song.coverArtUrl ? (
            <Image
              source={{ uri: song.coverArtUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={180}
            />
          ) : (
            <AppText variant="caption" color={colors.muted}>
              {String(index + 1).padStart(2, "0")}
            </AppText>
          )}
        </View>

        <View style={styles.meta}>
          <AppText
            variant="bodyBold"
            color={active ? colors.accent : colors.text}
            numberOfLines={1}
          >
            {song.title}
          </AppText>

          {!!song.description && (
            <AppText variant="caption" color={colors.muted} numberOfLines={1} style={styles.desc}>
              {song.description}
            </AppText>
          )}

          {song.labels?.length > 0 && (
            <View style={styles.chips}>
              {song.labels.map((l) => (
                <LabelChip key={l} label={l} />
              ))}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default memo(TrackRow);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.page,
    paddingVertical: space.md,
    borderLeftWidth: 2,
    borderLeftColor: "transparent",
  },
  rowActive: {
    backgroundColor: "rgba(212,130,10,0.06)",
    borderLeftColor: colors.accent,
  },
  rowPressed: { backgroundColor: "rgba(255,255,255,0.03)" },
  cover: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { flex: 1, minWidth: 0 },
  desc: { marginTop: 2 },
  chips: { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
});
