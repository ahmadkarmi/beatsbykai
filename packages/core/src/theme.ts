// Brand tokens. The web app's source of truth is the `@theme` block in
// apps/web/app/globals.css; these values must stay in step with it. Mobile has
// no CSS layer, so it consumes these directly.

export const colors = {
  background: "#0a0a0a",
  surface: "#111111",
  surface2: "#1a1a1a",
  border: "#242424",
  accent: "#d4820a",
  accentHover: "#e8970c",
  text: "#f0f0f0",
  muted: "#7a7a7a",
  glass: "rgba(10, 10, 10, 0.88)",
} as const;

/**
 * Song label colours as raw values, for platforms without Tailwind.
 *
 * The web app cannot use these: Tailwind only emits classes it can find as
 * literal strings at build time, so `apps/web/lib/labels.ts` keeps the class
 * strings. Both must describe the same colours — emerald / amber / violet at
 * 15% fill with a 25% border.
 */
export const LABEL_COLORS = {
  new: { bg: "rgba(16,185,129,0.15)", fg: "#34d399", border: "rgba(16,185,129,0.25)" },
  trending: { bg: "rgba(245,158,11,0.15)", fg: "#fbbf24", border: "rgba(245,158,11,0.25)" },
  featured: { bg: "rgba(139,92,246,0.15)", fg: "#a78bfa", border: "rgba(139,92,246,0.25)" },
} as const;

export const FONT_FAMILY = "Space Grotesk";
