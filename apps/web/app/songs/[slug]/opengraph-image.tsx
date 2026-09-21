/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text --
   Satori rasterises this tree: <img> is its only image primitive (next/image
   does not work here) and alt text has no output to land in. */
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { readFileSync } from "fs";
import { join } from "path";
import { getSongBySlug } from "@/lib/data/songs";
import { ARTIST_NAME, ARTIST_DESCRIPTION } from "@beatsbykai/core";

export const runtime = "nodejs";
export const revalidate = 60;
export const contentType = "image/jpeg";
export const size = { width: 1200, height: 630 };
export const alt = `A song by ${ARTIST_NAME}`;

/**
 * next/og can only emit PNG, and a 1200x630 PNG of photographic cover art
 * lands at 750KB-1MB. WhatsApp silently drops any og:image over roughly
 * 300KB and renders a text-only preview, so the card is re-encoded as JPEG
 * before it goes out. See vercel/next.js#60366.
 */
const JPEG_QUALITY = 85;

const AMBER = "#d4820a";
const INK = "#0a0a0a";

/** Cover is square and fills the full card height, so the art is never cropped. */
const ART = size.height;
const PANEL_PAD = 62;
const DESC_MAX = 115;

function readAsset(relPath: string): Buffer {
  return readFileSync(join(process.cwd(), relPath));
}

function toDataUri(buf: Buffer, mime: string): string {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/**
 * `coverArtUrl` is operator-supplied data that we fetch server-side, so it is
 * an SSRF sink. Pin it to the media host rather than trusting the value.
 */
const MEDIA_HOST = "pub-56eee1e388224dd293f25bccc68afdca.r2.dev";

function isAllowedCover(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === MEDIA_HOST;
  } catch {
    return false;
  }
}

/** Cover art as a data URI. Falls back to the brand mark if R2 is unreachable. */
async function loadCover(coverArtUrl: string): Promise<string> {
  if (coverArtUrl && isAllowedCover(coverArtUrl)) {
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

/**
 * The text panel is ~446px of usable width, so a fixed size would wrap the
 * longer titles in the catalogue ("The Village Drew The Line") into an ugly
 * three-line stack. Step the size down instead.
 */
function titleSize(title: string): number {
  if (title.length > 22) return 48;
  if (title.length > 15) return 55;
  return 62;
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

  const png = await new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: INK,
          fontFamily: "Space Grotesk",
        }}
      >
        {/* Cover art — full height, square, uncropped */}
        <img src={cover} width={ART} height={ART} style={{ objectFit: "cover" }} />

        {/* Text panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: `0 ${PANEL_PAD}px`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.34em",
              color: "rgba(240,240,240,0.45)",
            }}
          >
            <div style={{ display: "flex" }}>{ARTIST_NAME.toUpperCase()}</div>
            <div style={{ display: "flex", color: AMBER }}>·</div>
            <div style={{ display: "flex" }}>BEATSBYKAI.COM</div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: titleSize(title),
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              lineHeight: 1.06,
              marginTop: 26,
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              width: 68,
              height: 4,
              borderRadius: 2,
              backgroundColor: AMBER,
              marginTop: 24,
            }}
          />

          <div
            style={{
              display: "flex",
              fontSize: 25,
              color: "rgba(240,240,240,0.72)",
              lineHeight: 1.45,
              marginTop: 24,
            }}
          >
            {description}
          </div>
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
  ).arrayBuffer();

  const jpeg = await sharp(Buffer.from(png))
    .jpeg({ quality: JPEG_QUALITY, progressive: true })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": contentType,
      // Matches `revalidate` above; SWR keeps crawlers off the render path.
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400",
    },
  });
}
