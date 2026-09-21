import type { Song } from "./types";

// Tags arrive from the Worker "#"-prefixed and free-form ("#war", "#orwell").
// URLs use a bare, lowercased slug.

export type TagSummary = {
  slug: string;
  /** Display form, always "#"-prefixed. */
  label: string;
  count: number;
};

/**
 * A tag page listing a single song is thin content: near-duplicate of the song
 * page, no extra value to a searcher. Those pages still exist and still work —
 * every tag stays clickable — but they are noindexed and kept out of the
 * sitemap so crawl budget and link equity go to the themes that have depth.
 */
export const TAG_INDEX_MIN_SONGS = 2;

export function isIndexableTag(count: number): boolean {
  return count >= TAG_INDEX_MIN_SONGS;
}

export function tagSlug(tag: string): string {
  return tag
    .trim()
    .replace(/^#+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function tagLabel(slug: string): string {
  return `#${slug.replace(/^#+/, "")}`;
}

export function songHasTag(song: Song, slug: string): boolean {
  return (song.tags ?? []).some((t) => tagSlug(t) === slug);
}

export function songsForTag(songs: Song[], slug: string): Song[] {
  return songs.filter((s) => songHasTag(s, slug));
}

/** Every distinct tag with its song count, most used first, then alphabetical. */
export function collectTags(songs: Song[]): TagSummary[] {
  const byslug = new Map<string, TagSummary>();

  for (const song of songs) {
    // A song tagged "#war" and "#War" should only count once.
    const seen = new Set<string>();
    for (const raw of song.tags ?? []) {
      const slug = tagSlug(raw);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);

      const existing = byslug.get(slug);
      if (existing) existing.count += 1;
      else byslug.set(slug, { slug, label: tagLabel(slug), count: 1 });
    }
  }

  return [...byslug.values()].sort(
    (a, b) => b.count - a.count || a.slug.localeCompare(b.slug)
  );
}
