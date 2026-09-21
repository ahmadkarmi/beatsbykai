import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ARTIST_NAME, ARTIST_DESCRIPTION, formatTime } from "@beatsbykai/core";
import AppText from "@/components/AppText";
import { colors, space } from "@/theme";

/**
 * Slice 3 skeleton. Replaced by the real library screen in slice 4.
 *
 * It deliberately touches the things most likely to be mis-wired in a
 * monorepo: a value and a function imported from @beatsbykai/core through
 * Metro, both font weights, and the theme tokens.
 */
export default function LibraryScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space.xl }]}>
      <AppText variant="micro" color={colors.muted}>
        Now Playing
      </AppText>

      <AppText variant="title" style={styles.title}>
        {ARTIST_NAME}
      </AppText>

      <View style={styles.rule} />

      <AppText variant="body" color={colors.muted} style={styles.description}>
        {ARTIST_DESCRIPTION}
      </AppText>

      <View style={styles.checks}>
        <AppText variant="caption" color={colors.muted}>
          regular / bold rendering:
        </AppText>
        <View style={styles.row}>
          <AppText variant="body">Space Grotesk</AppText>
          <AppText variant="bodyBold" color={colors.accent}>
            Space Grotesk
          </AppText>
        </View>
        <AppText variant="caption" color={colors.muted}>
          core reachable through metro: formatTime(196.3) = {formatTime(196.3)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: space.page,
  },
  title: { marginTop: space.md },
  rule: {
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: space.md,
  },
  description: { marginTop: space.lg, maxWidth: 320 },
  checks: { marginTop: space.xl * 2, gap: space.sm },
  row: { flexDirection: "row", gap: space.md, alignItems: "baseline" },
});
