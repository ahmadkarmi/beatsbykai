import { useState } from "react";
import { Pressable, ScrollView, View, useWindowDimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { ARTIST_NAME } from "@beatsbykai/core";
import { useSongs } from "@/data/SongsProvider";
import AppText from "@/components/AppText";
import LabelChip from "@/components/LabelChip";
import { ChevronDownIcon, PlaceholderCoverIcon, ShareIcon } from "@/components/icons";
import { colors, radius, space } from "@/theme";

type Section = "lyrics" | "kaisays";

export default function SongScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { getBySlug, loading } = useSongs();

  const song = getBySlug(slug);
  const [section, setSection] = useState<Section>("lyrics");

  if (!song) {
    return (
      <View style={styles.centered}>
        <AppText variant="body" color={colors.muted}>
          {loading ? "Loading" : "Song not found."}
        </AppText>
      </View>
    );
  }

  const hasLyrics = !!song.lyrics;
  const hasKaiSays = !!song.explanation;
  const body = section === "lyrics" ? song.lyrics : song.explanation;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: space.xl * 2 }}>
      {/* Cover hero — 45% of the viewport, matching the web's 45dvh */}
      <View style={[styles.hero, { height: height * 0.45 }]}>
        {song.coverArtUrl ? (
          <Animated.View entering={FadeIn.duration(300)} style={StyleSheet.absoluteFill}>
            <Image
              source={{ uri: song.coverArtUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={220}
            />
          </Animated.View>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.coverFallback]}>
            <PlaceholderCoverIcon />
          </View>
        )}

        {/* Top vignette for control legibility, bottom fade into the page */}
        <LinearGradient
          colors={["rgba(0,0,0,0.75)", "rgba(0,0,0,0.25)", "transparent"]}
          style={styles.topVignette}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["transparent", colors.background]}
          style={styles.bottomFade}
          pointerEvents="none"
        />

        <View style={[styles.headerRow, { paddingTop: insets.top + space.sm }]}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            accessibilityRole="button"
            accessibilityLabel="Back to Library"
            hitSlop={8}
            style={styles.headerButton}
          >
            <ChevronDownIcon color="rgba(255,255,255,0.95)" />
          </Pressable>

          <AppText variant="micro" color="rgba(255,255,255,0.6)">
            Now Playing
          </AppText>

          {/* Wired to the native share sheet in a later slice. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Share ${song.title}`}
            hitSlop={8}
            style={styles.headerButton}
            disabled
          >
            <ShareIcon color="rgba(255,255,255,0.35)" />
          </Pressable>
        </View>
      </View>

      <Animated.View entering={FadeInDown.duration(320)} style={styles.meta}>
        <AppText variant="title">{song.title}</AppText>

        <View style={styles.metaRow}>
          <AppText variant="micro" color={colors.muted}>
            {ARTIST_NAME.toUpperCase()}
          </AppText>
          {song.labels?.map((l) => (
            <LabelChip key={l} label={l} />
          ))}
        </View>

        {song.tags?.length > 0 && (
          <View style={styles.tags}>
            {song.tags.map((t) => (
              <AppText key={t} variant="caption" color={colors.muted}>
                {t}
              </AppText>
            ))}
          </View>
        )}

        {!song.mp3Url && (
          <AppText variant="micro" color={colors.muted} style={styles.comingSoon}>
            Coming Soon
          </AppText>
        )}
      </Animated.View>

      {(hasLyrics || hasKaiSays) && (
        <View style={styles.sections}>
          <View style={styles.tabRow}>
            {hasLyrics && (
              <SectionTab label="Lyrics" active={section === "lyrics"} onPress={() => setSection("lyrics")} />
            )}
            {hasKaiSays && (
              <SectionTab label="Kai Says" active={section === "kaisays"} onPress={() => setSection("kaisays")} />
            )}
          </View>

          {!!body && (
            <AppText variant="lyrics" color="rgba(240,240,240,0.6)" style={styles.body}>
              {body}
            </AppText>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function SectionTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[styles.tab, active && styles.tabActive]}
    >
      <AppText variant="label" color={active ? colors.text : colors.muted}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  hero: { width: "100%", overflow: "hidden" },
  coverFallback: { backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center" },
  topVignette: { position: "absolute", top: 0, left: 0, right: 0, height: 140 },
  bottomFade: { position: "absolute", bottom: 0, left: 0, right: 0, height: "50%" },
  headerRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
  },
  headerButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  meta: { paddingHorizontal: space.page, marginTop: space.sm },
  metaRow: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.sm, flexWrap: "wrap" },
  tags: { flexDirection: "row", gap: space.md, marginTop: space.sm, flexWrap: "wrap" },
  comingSoon: { marginTop: space.md },
  sections: { marginTop: space.xl, paddingHorizontal: space.page },
  tabRow: { flexDirection: "row", gap: space.sm },
  tab: {
    paddingHorizontal: space.lg,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  tabActive: { backgroundColor: "rgba(255,255,255,0.1)" },
  body: { marginTop: space.lg },
});
