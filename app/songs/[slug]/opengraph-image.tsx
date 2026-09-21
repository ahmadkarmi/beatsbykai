/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text --
   Satori rasterises this tree: <img> is its only image primitive (next/image
   does not work here) and alt text has no output to land in. */
import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { getSongBySlug } from "@/lib/data/songs";
import { ARTIST_NAME, ARTIST_DESCRIPTION } from "@/lib/site";

export const runtime = "nodejs";
export const revalidate = 60;
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = `A song by ${ARTIST_NAME}`;

// Satori blurs in place, which leaves dark fringing at the element's edges.
// Rendering the backdrop far larger than the frame pushes that fringe outside
// the 1200x630 crop entirely. See vercel/satori#309.
const BACKDROP = 1800;
const DESC_MAX = 115;

function readAsset(relPath: string): Buffer {
  return readFileSync(join(process.cwd(), relPath));
}

function toDataUri(buf: Buffer, mime: string): string {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/** Cover art as a data URI. Falls back to the brand mark if R2 is unreachable. */
async function loadCover(coverArtUrl: string): Promise<string> {
  if (coverArtUrl) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(coverArtUrl, { signal: controller.signal });
      if (res.ok) {
        const mime = res.headers.get("content-type") || "image/jpeg";
        return toDataUri(Buffer.from(await res.arrayBuffer()), mime);
      }
    } catch {
      // fall through to the brand mark
    } finally {
      clearTimeout(timer);
    }
  }
  return toDataUri(readAsset("public/BeatsByKaiDarkBG.png"), "image/png");
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export default async function SongOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const song = await getSongBySlug(slug);

  const title = song?.title ?? ARTIST_NAME;
  const description = truncate(song?.description || ARTIST_DESCRIPTION, DESC_MAX);
  const cover = await loadCover(song?.coverArtUrl ?? "");

  const [regular, bold] = [
    readAsset("public/fonts/SpaceGrotesk-Regular.ttf"),
    readAsset("public/fonts/SpaceGrotesk-Bold.ttf"),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#0a0a0a",
          fontFamily: "Space Grotesk",
        }}
      >
        {/* Blurred cover backdrop, oversized so blur fringing falls outside the frame */}
        <img
          src={cover}
          width={BACKDROP}
          height={BACKDROP}
          style={{
            position: "absolute",
            left: (size.width - BACKDROP) / 2,
            top: (size.height - BACKDROP) / 2,
            filter: "blur(70px) saturate(1.7) brightness(0.52)",
            objectFit: "cover",
          }}
        />

        {/* Scrim — holds contrast for the type regardless of how bright the art is */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size.width,
            height: size.height,
            display: "flex",
            backgroundImage:
              "linear-gradient(180deg, rgba(10,10,10,0.52) 0%, rgba(10,10,10,0.74) 46%, rgba(10,10,10,0.93) 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "44px 72px 84px",
          }}
        >
          <img
            src={cover}
            width={244}
            height={244}
            style={{
              borderRadius: 14,
              objectFit: "cover",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          />

          <div
            style={{
              display: "flex",
              fontSize: 56,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              marginTop: 34,
              textAlign: "center",
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              width: 76,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#d4820a",
              marginTop: 20,
            }}
          />

          <div
            style={{
              display: "flex",
              fontSize: 27,
              color: "rgba(240,240,240,0.80)",
              lineHeight: 1.42,
              marginTop: 20,
              maxWidth: 880,
              textAlign: "center",
            }}
          >
            {description}
          </div>
        </div>

        {/* Footer wordmark */}
        <div
          style={{
            position: "absolute",
            bottom: 34,
            left: 0,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "0.34em",
            color: "rgba(240,240,240,0.55)",
          }}
        >
          <div style={{ display: "flex" }}>{ARTIST_NAME.toUpperCase()}</div>
          <div style={{ display: "flex", color: "rgba(212,130,10,0.85)" }}>·</div>
          <div style={{ display: "flex" }}>BEATSBYKAI.COM</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Space Grotesk", data: regular, weight: 400, style: "normal" },
        { name: "Space Grotesk", data: bold, weight: 700, style: "normal" },
      ],
    }
  );
}
