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
// TODO: replace with real profile URLs as each goes live (Spotify, Apple Music,
// YouTube, Instagram, TikTok). Leave commented until live — empty is better than fake.
export const SOCIAL_LINKS: string[] = [
  "https://www.instagram.com/beatsbykaikw",
  // "https://open.spotify.com/artist/...",
  // "https://music.apple.com/us/artist/...",
  // "https://www.youtube.com/@...",
  // "https://www.tiktok.com/@...",
];

// Everything that represents Kai across the web: own site + external profiles.
export const SAME_AS: string[] = [SITE_URL, ...SOCIAL_LINKS];
