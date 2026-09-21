import type { SongLabel } from "@beatsbykai/core";

// Tailwind only emits classes it can find as literal strings at build time,
// so these cannot be generated from @beatsbykai/core's LABEL_COLORS — but the
// two must describe the same colours. Previously duplicated across four
// public-site components with two different alpha treatments.
//
// The control panel keeps its own chips: it runs on the separate cp-* palette
// and is deliberately not styled like the public site.
export const LABEL_STYLES: Record<SongLabel, string> = {
  new: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  trending: "bg-amber-500/15  text-amber-400  border border-amber-500/25",
  featured: "bg-violet-500/15 text-violet-400 border border-violet-500/25",
};
