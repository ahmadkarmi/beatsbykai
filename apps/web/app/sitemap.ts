import type { MetadataRoute } from "next";
import { getPublishedSongs } from "@/lib/data/songs";
import { SITE_URL as BASE } from "@beatsbykai/core";
import { collectTags, isIndexableTag } from "@beatsbykai/core";
import { parseSongDate } from "@beatsbykai/core";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const songs = await getPublishedSongs();

  const songEntries: MetadataRoute.Sitemap = songs.map((song) => ({
    url: `${BASE}/songs/${song.slug}`,
    lastModified: parseSongDate(song.createdAt) ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const tagEntries: MetadataRoute.Sitemap = collectTags(songs)
    .filter((tag) => isIndexableTag(tag.count))
    .map((tag) => ({
    url: `${BASE}/tags/${tag.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ...songEntries,
    ...tagEntries,
  ];
}
