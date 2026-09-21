import { useCallback } from "react";
import { FlatList, RefreshControl, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ARTIST_DESCRIPTION, type Song } from "@beatsbykai/core";
import { useSongs } from "@/data/SongsProvider";
import AppText from "@/components/AppText";
import TrackRow from "@/components/TrackRow";
import { colors, space } from "@/theme";

const HERO = require("../../../../assets/hero.jpg");

function Hero({ featured }: { featured?: Song }) {
  return (
    <Animated.View entering={FadeInDown.duration(420)}>
      <View style={styles.hero}>
        <Image source={HERO} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={["transparent", "rgba(10,10,10,0.65)", colors.background]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroCopy}>
          <AppText variant="micro" color={colors.muted}>
            AI Rapper · Kuwait
          </AppText>
          <AppText variant="title" style={styles.heroTitle}>
            {featured?.title ?? "Kai"}
          </AppText>
          <View style={styles.rule} />
          <AppText variant="caption" color={colors.muted} style={styles.heroDesc} numberOfLines={2}>
            {featured?.description ?? ARTIST_DESCRIPTION}
          </AppText>
        </View>
      </View>
    </Animated.View>
  );
}

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { songs, loading, stale, refresh } = useSongs();

  // Matches web: first song labelled "featured", else the first song.
  const featured = songs.find((s) => s.labels?.includes("featured")) ?? songs[0];

  const open = useCallback(
    (song: Song) => router.push(`/songs/${song.slug}`),
    [router]
  );

  if (loading && songs.length === 0) {
    return (
      <View style={styles.centered}>
        <AppText variant="micro" color={colors.muted}>
          Loading
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={songs}
      keyExtractor={(s) => s.id}
      contentContainerStyle={{ paddingBottom: space.xl }}
      ListHeaderComponent={
        <>
          <Hero featured={featured} />
          {stale && (
            <View style={styles.staleBanner}>
              <AppText variant="caption" color={colors.muted}>
                Showing saved tracks — couldn&apos;t reach the server.
              </AppText>
            </View>
          )}
        </>
      }
      ListEmptyComponent={
        <View style={styles.centered}>
          <AppText variant="body" color={colors.muted}>
            No tracks yet.
          </AppText>
        </View>
      }
      renderItem={({ item, index }) => (
        <TrackRow song={item} index={index} onPress={open} />
      )}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={refresh}
          tintColor={colors.muted}
          progressViewOffset={insets.top}
        />
      }
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.xl * 2 },
  hero: { height: 340, justifyContent: "flex-end" },
  heroCopy: { paddingHorizontal: space.page, paddingBottom: space.lg },
  heroTitle: { marginTop: space.sm },
  rule: { width: 48, height: 3, borderRadius: 2, backgroundColor: colors.accent, marginTop: space.md },
  heroDesc: { marginTop: space.md, maxWidth: 320 },
  staleBanner: {
    paddingHorizontal: space.page,
    paddingVertical: space.sm,
    backgroundColor: colors.surface,
  },
});
