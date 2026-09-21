import { View, StyleSheet } from "react-native";
import { LABEL_COLORS, type SongLabel } from "@beatsbykai/core";
import AppText from "./AppText";

/** Mirrors apps/web/lib/labels.ts — the colours come from the same source. */
export default function LabelChip({ label }: { label: SongLabel }) {
  const c = LABEL_COLORS[label];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg, borderColor: c.border }]}>
      <AppText variant="chip" color={c.fg}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
  },
});
