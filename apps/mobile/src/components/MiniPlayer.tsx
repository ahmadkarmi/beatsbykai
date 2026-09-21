import { Pressable, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { usePlayer } from "@/player/PlayerContext";
import { analytics } from "@/lib/analytics";
import AppText from "./AppText";
import { PauseIcon, PlayIcon } from "./icons";
import { colors, layout, radius, space } from "@/theme";

/**
 * Sits directly above the tab bar, inside the same tabBar render prop — so
 * React Navigation measures the pair and screens get the correct bottom
 * inset automatically, rather than the web's hardcoded padding.
 *
 * Hidden on the song screen, where the full player is already on display.
 * Same rule as the web MiniPlayer.
 */
export default function MiniPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentSong, isPlaying, progress, pause, resume } = usePlayer();

  if (!currentSong || pathname.startsWith("/songs/")) return null;

  const open = () => {
    analytics.trackMiniPlayerTap(currentSong.title, currentSong.slug);
    router.push(`/songs/${currentSong.slug}`);
  };

  const noAudio = !currentSong.mp3Url;

  return (
    <View style={styles.wrap}>
      {/* 1px progress line, matching web */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
      </View>

      <Pressable onPress={open} style={styles.row} accessibilityRole="button">
        <View style={styles.cover}>
          {!!currentSong.coverArtUrl && (
            <Image
              source={{ uri: currentSong.coverArtUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
            />
          )}
        </View>

        <View style={styles.meta}>
          <AppText variant="bodyBold" numberOfLines={1}>
            {currentSong.title}
          </AppText>
          <AppText variant="caption" color={colors.muted} numberOfLines={1}>
            {noAudio ? "Coming Soon" : currentSong.description}
          </AppText>
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            if (noAudio) return;
            if (isPlaying) pause();
            else resume();
          }}
          disabled={noAudio}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? `Pause ${currentSong.title}` : `Play ${currentSong.title}`}
          style={styles.button}
        >
          {isPlaying ? (
            <PauseIcon size={18} color={colors.text} />
          ) : (
            <PlayIcon size={18} color={noAudio ? "rgba(255,255,255,0.2)" : colors.text} />
          )}
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: layout.miniPlayerHeight,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  track: { height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  fill: { height: 1, backgroundColor: colors.accent },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.md,
  },
  cover: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: colors.surface2,
  },
  meta: { flex: 1, minWidth: 0 },
  button: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
});
