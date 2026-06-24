import type { Metadata } from "next";
import { getPublishedSongs } from "@/lib/data/songs";
import LibraryView from "@/components/library/LibraryView";
import {
  SITE_URL,
  SITE_TITLE,
  ARTIST_NAME,
  ARTIST_DESCRIPTION,
  SAME_AS,
} from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE_TITLE} | beatsbykai` },
  description: ARTIST_DESCRIPTION,
  alternates: { canonical: "/" },
};

export const revalidate = 60;

export default async function LibraryPage() {
  const songs = await getPublishedSongs();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MusicGroup",
        "@id": `${SITE_URL}/#artist`,
        name: ARTIST_NAME,
        url: SITE_URL,
        description: ARTIST_DESCRIPTION,
        genre: "Hip-Hop",
        sameAs: SAME_AS,
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "beatsbykai",
        url: SITE_URL,
        logo: `${SITE_URL}/icon.png`,
        sameAs: SAME_AS,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: ARTIST_NAME,
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
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
