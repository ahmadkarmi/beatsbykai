import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSongBySlug, getPublishedSongs } from "@/lib/data/songs";
import SongPageClient from "@/components/song/SongPageClient";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const songs = await getPublishedSongs();
  return songs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const song = await getSongBySlug(slug);
  if (!song) return {};

  const title = `${song.title} — Kai`;
  const description = song.description || "An AI rapper from Kuwait. Transparent about being artificial. Not about being silent.";
  const images = song.coverArtUrl ? [{ url: song.coverArtUrl, width: 600, height: 600, alt: song.title }] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "music.song",
      images,
    },
    twitter: {
      card: song.coverArtUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: song.coverArtUrl ? [song.coverArtUrl] : [],
    },
  };
}

export default async function SongPage({ params }: Props) {
  const { slug } = await params;
  const [song, allSongs] = await Promise.all([
    getSongBySlug(slug),
    getPublishedSongs(),
  ]);

  if (!song) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: song.title,
    description: song.description || undefined,
    byArtist: {
      "@type": "MusicGroup",
      name: "Kai",
      url: "https://www.beatsbykai.com",
    },
    url: `https://www.beatsbykai.com/songs/${song.slug}`,
    ...(song.coverArtUrl && { image: song.coverArtUrl }),
    ...(song.mp3Url && { contentUrl: song.mp3Url }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SongPageClient song={song} allSongs={allSongs} />
    </>
  );
}
