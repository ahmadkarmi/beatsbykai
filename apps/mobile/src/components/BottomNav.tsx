import { Pressable, View, StyleSheet, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { usePlayer } from "@/player/PlayerContext";
import EqualizerBars from "./EqualizerBars";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ComponentProps } from "react";
import { Tabs, useRouter } from "expo-router";
import AppText from "./AppText";
import { AboutIcon, LibraryIcon } from "./icons";
import { colors, layout, space } from "@/theme";

// Mirrors the web BottomNav's two tabs. The animated "Playing" tab is
// deliberately absent until the player exists in slice 5 — on web it is not a
// route either, just a link that appears once a song is loaded.
const TABS = [
  { name: "(library)", label: "Library", Icon: LibraryIcon },
  { name: "about", label: "About", Icon: AboutIcon },
] as const;

// SDK 57 vendors react-navigation inside expo-router, so
// @react-navigation/bottom-tabs is not an installable package. Derive the
// prop type from the public Tabs component rather than reaching into
// expo-router/build/**, which would break on any internal restructure.
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

export default function BottomNav({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { currentSong, isPlaying } = usePlayer();

  // Not a Tabs.Screen: on web this is not a route either, just a link that
  // appears once a song with audio is loaded. Width is animated as an
  // absolute value — Reanimated does not interpolate percentage strings
  // reliably.
  const hasActiveSong = !!currentSong?.mp3Url;
  const playingStyle = useAnimatedStyle(() => ({
    width: withTiming(hasActiveSong ? width * 0.3 : 0, { duration: 300 }),
    opacity: withTiming(hasActiveSong ? 1 : 0, { duration: 300 }),
  }));

  return (
    <View
      style={[styles.bar, { height: layout.tabBarHeight + insets.bottom, paddingBottom: insets.bottom }]}
      accessibilityRole="tablist"
    >
      {TABS.map(({ name, label, Icon }) => {
        const routeIndex = state.routes.findIndex((r: { name: string }) => r.name === name);
        const focused = state.index === routeIndex;
        const color = focused ? colors.accent : colors.muted;

        return (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
              if (!focused) navigation.navigate(name);
            }}
            style={styles.tab}
          >
            {focused && <View style={styles.activeBar} />}
            <Icon size={18} color={color} />
            <AppText variant="micro" color={color} style={styles.label}>
              {label}
            </AppText>
          </Pressable>
        );
      })}

      <Animated.View style={[styles.playing, playingStyle]}>
        <Pressable
          onPress={() => currentSong && router.push(`/songs/${currentSong.slug}`)}
          accessibilityRole="button"
          accessibilityLabel="Now playing"
          style={styles.tab}
        >
          <EqualizerBars playing={isPlaying} color={colors.accent} />
          <AppText variant="micro" color={colors.accent} style={styles.label}>
            Playing
          </AppText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
  },
  activeBar: {
    position: "absolute",
    top: 0,
    width: 28,
    height: 2,
    backgroundColor: colors.accent,
  },
  label: { marginTop: 2 },
  playing: { overflow: "hidden", justifyContent: "center" },
});
