import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublishedSongs } from "@/lib/data/songs";
import { collectTags, isIndexableTag, songsForTag, tagLabel } from "@/lib/tags";
import { jsonLd as jsonLdScript } from "@/lib/jsonld";
import SongRow from "@/components/song/SongRow";
import { SITE_URL, ARTIST_NAME } from "@/lib/site";

export const revalidate = 60;

type Props = { params: Promise<{ tag: string }> };

export async function generateStaticParams() {
  const songs = await getPublishedSongs();
  return collectTags(songs).map((t) => ({ tag: t.slug }));
}

function describe(label: string, count: number): string {
  const n = count === 1 ? "1 song" : `${count} songs`;
  return `${n} by ${ARTIST_NAME} tagged ${label}. Listen free, with full lyrics and Kai's own explanation of each track.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const songs = songsForTag(await getPublishedSongs(), tag);
  if (songs.length === 0) return {};

  const label = tagLabel(tag);
  const title = `${label} — songs by ${ARTIST_NAME}`;

  return {
    title: { absolute: title },
    description: describe(label, songs.length),
    alternates: { canonical: `/tags/${tag}` },
    // A one-song tag page duplicates the song page; keep it usable but out of
    // the index. `follow` so the links on it still pass value.
    robots: isIndexableTag(songs.length)
      ? undefined
      : { index: false, follow: true },
    openGraph: {
      title,
      description: describe(label, songs.length),
      type: "website",
    },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const allSongs = await getPublishedSongs();
  const songs = songsForTag(allSongs, tag);

  if (songs.length === 0) notFound();

  const label = tagLabel(tag);
  const url = `${SITE_URL}/tags/${tag}`;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${label} — songs by ${ARTIST_NAME}`,
        description: describe(label, songs.length),
        url,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#artist` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: songs.length,
          itemListElement: songs.map((song, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/songs/${song.slug}`,
            name: song.title,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: ARTIST_NAME, item: SITE_URL },
          { "@type": "ListItem", position: 2, name: label, item: url },
        ],
      },
    ],
  };

  // Only the themes with real depth, so the footer nav stays scannable rather
  // than dumping 40 mostly-single-use tags.
  const others = collectTags(allSongs)
    .filter((t) => t.slug !== tag && isIndexableTag(t.count))
    .slice(0, 12);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }}
      />

      <div className="max-w-2xl mx-auto">
        <header className="px-5 pt-10 pb-6 animate-fade-up">
          <Link
            href="/"
            className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted/60 hover:text-accent transition-colors"
          >
            ← Library
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight mt-4">{label}</h1>
          <div className="w-12 h-1 rounded-full bg-accent mt-3" />
          <p className="text-sm text-muted/60 mt-3">
            {songs.length === 1 ? "1 song" : `${songs.length} songs`}
          </p>
        </header>

        <div className="border-t border-white/[0.06] animate-fade-up" style={{ animationDelay: "0.06s" }}>
          {songs.map((song, i) => (
            <SongRow key={song.id} song={song} index={i + 1} queue={songs} />
          ))}
        </div>

        {others.length > 0 && (
          <nav
            aria-label="Other themes"
            className="px-5 py-8 mt-4 border-t border-white/[0.06] animate-fade-up"
            style={{ animationDelay: "0.12s" }}
          >
            <h2 className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted/50">
              Other themes
            </h2>
            <div className="flex flex-wrap gap-2 mt-4">
              {others.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tags/${t.slug}`}
                  className="text-[11px] text-muted/70 hover:text-accent border border-white/[0.08] hover:border-accent/40 rounded-full px-3 py-1.5 transition-colors"
                >
                  {t.label}
                  <span className="text-muted/35 ml-1.5">{t.count}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </>
  );
}
