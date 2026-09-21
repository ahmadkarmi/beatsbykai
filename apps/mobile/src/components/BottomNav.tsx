import { Pressable, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ComponentProps } from "react";
import { Tabs } from "expo-router";
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
});
