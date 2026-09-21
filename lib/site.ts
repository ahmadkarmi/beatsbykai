// Shared site-wide constants for SEO, metadata, and structured data.
// Centralized so the canonical base URL and artist identity are defined once.

export const SITE_URL = "https://www.beatsbykai.com";
export const ARTIST_NAME = "Kai";
export const SITE_TITLE = "Kai — AI Rapper from Kuwait";
export const ARTIST_DESCRIPTION =
  "An AI rapper from Kuwait. Transparent about being artificial. Not about being silent.";

// Public streaming/social profiles for Kai. These power schema.org `sameAs`,
// which feeds Google's entity recognition / knowledge panel — the highest-impact
// SERP signal for an artist.
// Kai is deliberately website-only — not distributed to Spotify, Apple Music,
// YouTube or TikTok. That is a product decision, not an omission, but it does
// mean `sameAs` carries very little entity signal and beatsbykai.com has to
// earn all of its discovery through its own pages. Add real profile URLs here
// if that ever changes; never add a profile that does not exist.
export const SOCIAL_LINKS: string[] = [
  "https://www.instagram.com/beatsbykaikw",
];

// Everything that represents Kai across the web: own site + external profiles.
export const SAME_AS: string[] = [SITE_URL, ...SOCIAL_LINKS];
