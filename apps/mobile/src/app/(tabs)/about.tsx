import { useState } from "react";
import { Pressable, ScrollView, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { ABOUT_SECTIONS, ARTIST_NAME } from "@beatsbykai/core";
import AppText from "@/components/AppText";
import { colors, space } from "@/theme";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<string>(ABOUT_SECTIONS[0]?.id ?? "");

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.xl, paddingBottom: space.xl * 2 },
      ]}
    >
      <AppText variant="micro" color={colors.muted}>
        About
      </AppText>
      <AppText variant="title" style={styles.heading}>
        {ARTIST_NAME}
      </AppText>
      <View style={styles.rule} />

      <View style={styles.sections}>
        {ABOUT_SECTIONS.map((section, i) => {
          const isOpen = open === section.id;
          return (
            <Animated.View
              key={section.id}
              entering={FadeInDown.delay(i * 60).duration(320)}
              style={styles.section}
            >
              <Pressable
                onPress={() => setOpen(isOpen ? "" : section.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                style={styles.sectionHeader}
              >
                <AppText variant="label" color={colors.accent}>
                  {section.title}
                </AppText>
                <AppText
                  variant="body"
                  color={colors.muted}
                  style={{ transform: [{ rotate: isOpen ? "45deg" : "0deg" }] }}
                >
                  +
                </AppText>
              </Pressable>

              {/* The web animates height with a grid trick that has no RN
                  equivalent; a fade is the honest approximation and costs
                  40 fewer lines than measuring height by hand. */}
              {isOpen && (
                <Animated.View entering={FadeInDown.duration(200)} exiting={FadeOut.duration(140)}>
                  {section.paragraphs.map((p, j) => (
                    <AppText key={j} variant="body" style={j > 0 ? styles.para : undefined}>
                      {p}
                    </AppText>
                  ))}
                </Animated.View>
              )}
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.page },
  heading: { marginTop: space.sm },
  rule: { width: 48, height: 3, borderRadius: 2, backgroundColor: colors.accent, marginTop: space.md },
  sections: { marginTop: space.xl },
  section: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: space.lg,
    marginBottom: space.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: space.md,
  },
  para: { marginTop: space.md },
});
