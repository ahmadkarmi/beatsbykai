import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSongBySlug, getPublishedSongs } from "@/lib/data/songs";
import SongPageClient from "@/components/song/SongPageClient";
import { SITE_URL, ARTIST_NAME, ARTIST_DESCRIPTION, SAME_AS } from "@beatsbykai/core";
import { jsonLd as jsonLdScript } from "@/lib/jsonld";
import { toIsoDate } from "@beatsbykai/core";

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

  const title = song.title;
  const description = song.description || ARTIST_DESCRIPTION;

  // Images are intentionally omitted: the sibling opengraph-image.tsx supplies a
  // 1200x630 card. Setting `images` here would override that file convention and
  // resurface the raw 1:1 cover, which unfurls center-cropped.
  return {
    title,
    description,
    alternates: { canonical: `/songs/${song.slug}` },
    openGraph: {
      title,
      description,
      type: "music.song",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

  const songUrl = `${SITE_URL}/songs/${song.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MusicRecording",
        name: song.title,
        description: song.description || undefined,
        genre: "Hip-Hop",
        ...(toIsoDate(song.createdAt) && { datePublished: toIsoDate(song.createdAt) }),
        inLanguage: "en",
        ...(song.lyrics && {
          lyrics: { "@type": "CreativeWork", text: song.lyrics },
        }),
        byArtist: {
          "@type": "MusicGroup",
          name: ARTIST_NAME,
          url: SITE_URL,
          sameAs: SAME_AS,
        },
        url: songUrl,
        ...(song.coverArtUrl && { image: song.coverArtUrl }),
        ...(song.mp3Url && { contentUrl: song.mp3Url }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: ARTIST_NAME, item: SITE_URL },
          { "@type": "ListItem", position: 2, name: song.title, item: songUrl },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <SongPageClient song={song} allSongs={allSongs} />
    </>
  );
}
