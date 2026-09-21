// Generates the app icon, Android adaptive foreground and splash mark from
// the existing brand assets in apps/web/public.
//
// Run from apps/mobile:  node scripts/make-assets.mjs
//
// Regenerate whenever the source art changes. Checked-in outputs are what the
// build consumes, so this script never runs during a build.

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mobile = path.resolve(here, "..");
const webPublic = path.resolve(mobile, "../web/public");
const out = path.join(mobile, "assets");

const INK = { r: 0x0a, g: 0x0a, b: 0x0a, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

await mkdir(out, { recursive: true });

// 1. App icon — the K mark on brand black, 1024x1024, fully opaque. iOS
//    rejects alpha in the app icon and rounds the corners itself.
//
//    Not the Kai portrait: rendered at the ~48px an icon is actually seen at,
//    the portrait loses the face entirely and reads as grey noise, while the
//    mark stays legible at every size.
const ICON = 1024;
const iconMark = await sharp(path.join(webPublic, "KaiLogoWhite.png"))
  .resize({ width: Math.round(ICON * 0.64), fit: "inside", withoutEnlargement: true })
  .toBuffer();

await sharp({ create: { width: ICON, height: ICON, channels: 4, background: INK } })
  .composite([{ input: iconMark, gravity: "centre" }])
  .flatten({ background: INK })
  .png({ compressionLevel: 9, effort: 10 })
  .toFile(path.join(out, "icon.png"));

// 2. Android adaptive foreground — the outer ~18% of an adaptive icon is
//    masked off by the launcher, and the shape varies by device, so the mark
//    is inset well inside the safe zone on a transparent canvas.
const FG = 1024;
const SAFE = Math.round(FG * 0.6);
const mark = await sharp(path.join(webPublic, "KaiLogoWhite.png"))
  .resize({ width: SAFE, fit: "inside", withoutEnlargement: true })
  .toBuffer();

await sharp({
  create: { width: FG, height: FG, channels: 4, background: TRANSPARENT },
})
  .composite([{ input: mark, gravity: "centre" }])
  .png()
  .toFile(path.join(out, "adaptive-icon-foreground.png"));

// 3. Splash mark — app.json renders it at 220pt, so supply 2x for retina.
await sharp(path.join(webPublic, "KaiLogoWhite.png"))
  .resize({ width: 440, fit: "inside", withoutEnlargement: true })
  .png({ compressionLevel: 9 })
  .toFile(path.join(out, "splash-icon.png"));

// 4. Library hero — the Kai portrait, which does not work as an icon but is
//    exactly right at full width. JPEG: it is photographic and gains nothing
//    from PNG, at roughly a tenth the size.
await sharp(path.join(webPublic, "BeatsByKaiProfile.jpg"))
  .resize(1080, 1080, { fit: "cover" })
  .jpeg({ quality: 82, progressive: true })
  .toFile(path.join(out, "hero.jpg"));

for (const f of ["icon.png", "adaptive-icon-foreground.png", "splash-icon.png", "hero.jpg"]) {
  const meta = await sharp(path.join(out, f)).metadata();
  const kb = Math.round((await sharp(path.join(out, f)).toBuffer()).length / 1024);
  console.log(
    `  ${f.padEnd(30)} ${meta.width}x${meta.height}  alpha=${meta.hasAlpha}  ${kb}KB`
  );
}
