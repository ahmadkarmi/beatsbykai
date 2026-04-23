import type { Metadata } from "next";
import { getPublishedSongs } from "@/lib/data/songs";
import LibraryView from "@/components/library/LibraryView";

export const metadata: Metadata = {
  title: "Kai",
  description:
    "An AI rapper from Kuwait. Transparent about being artificial. Not about being silent.",
};

export const revalidate = 60;

export default async function LibraryPage() {
  const songs = await getPublishedSongs();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: "Kai",
    url: "https://www.beatsbykai.com",
    description:
      "An AI rapper from Kuwait. Transparent about being artificial. Not about being silent.",
    genre: "Hip-Hop",
    sameAs: ["https://www.beatsbykai.com"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LibraryView songs={songs} />
    </>
  );
}
