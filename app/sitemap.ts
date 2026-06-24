import type { MetadataRoute } from "next";
import { getPublishedSongs } from "@/lib/data/songs";
import { SITE_URL as BASE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const songs = await getPublishedSongs();

  const songEntries: MetadataRoute.Sitemap = songs.map((song) => ({
    url: `${BASE}/songs/${song.slug}`,
    lastModified: song.createdAt ? new Date(song.createdAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    ...songEntries,
  ];
}
