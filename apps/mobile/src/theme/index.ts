import { colors } from "@beatsbykai/core";

// Brand colours come from @beatsbykai/core so web and mobile cannot drift.
// Everything below is the mobile-only layer: type scale, spacing and the
// handful of values that only make sense on a native canvas.
export { colors };

export const fonts = {
  regular: "SpaceGrotesk_400Regular",
  bold: "SpaceGrotesk_700Bold",
} as const;

/**
 * React Native does NOT synthesise bold for custom fonts — `fontWeight: "700"`
 * is silently ignored on Android. Every bold style must name the bold family
 * explicitly, which is why weight never appears in this scale and why text
 * should go through <AppText>, not a raw <Text>.
 */
export const type = {
  /** 9px caps, heavy tracking — the "NOW PLAYING" / section-label treatment. */
  micro: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 9 * 0.3,
    textTransform: "uppercase",
  },
  /** 10px caps — pill buttons and tab labels. */
  label: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 10 * 0.2,
    textTransform: "uppercase",
  },
  /** 8px caps — the label chips on track rows. */
  chip: {
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 8 * 0.12,
    textTransform: "uppercase",
  },
  caption: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22 },
  bodyBold: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 22 },
  /** Lyrics: generous leading, matches the web's leading-loose. */
  lyrics: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 26 },
  title: { fontFamily: fonts.bold, fontSize: 30, letterSpacing: -0.4 },
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  page: 20,
} as const;

export const radius = {
  sm: 4,
  md: 12,
  lg: 16,
  pill: 9999,
} as const;

/** Heights the layout depends on in more than one place. */
export const layout = {
  tabBarHeight: 56,
  miniPlayerHeight: 64,
} as const;
