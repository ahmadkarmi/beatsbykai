"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SongLabel } from "@beatsbykai/core";
import { safeEqual } from "@/lib/safe-equal";
import { requireAdmin } from "./guard";
import { ADMIN_COOKIE, SESSION_TTL_MS, createSessionToken } from "./session";
import {
  clearFailures,
  failedAttemptDelay,
  isRateLimited,
  recordFailure,
} from "./rate-limit";
import {
  adminCreateSong,
  adminUpdateSong,
  adminDeleteSong,
  adminGetUploadToken,
  adminReorderSongs,
} from "./api";

const VALID_LABELS: SongLabel[] = ["new", "trending", "featured"];

function parseLabels(formData: FormData): SongLabel[] {
  return VALID_LABELS.filter((l) => formData.get(`label_${l}`) === "true");
}

function parseTags(formData: FormData): string[] {
  const raw = formData.get("tags") as string;
  if (!raw) return [];
  return raw.split(",").map((t) => t.trim()).filter(Boolean);
}

async function clientKey(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

export async function loginAction(formData: FormData) {
  const key = await clientKey();

  if (isRateLimited(key)) {
    await failedAttemptDelay();
    return { error: "Too many attempts. Try again later." };
  }

  const password = formData.get("password");
  const expected = process.env.ADMIN_PASSWORD;

  if (typeof password !== "string" || !expected || !(await safeEqual(password, expected))) {
    recordFailure(key);
    await failedAttemptDelay();
    return { error: "Invalid password" };
  }

  clearFailures(key);

  const jar = await cookies();
  // Signed expiry, not a secret — see lib/admin/session.ts.
  jar.set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
  redirect("/controlpanel");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/controlpanel/login");
}

export async function createSongAction(formData: FormData) {
  await requireAdmin();
  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const description = formData.get("description") as string;
  const lyrics = formData.get("lyrics") as string;
  const explanation = formData.get("explanation") as string;
  const published = formData.get("published") === "true";
  const hasFiles = formData.get("has_files") === "true";

  if (!title || !slug) return { error: "Title and slug are required" };

  try {
    const labels = parseLabels(formData);
    const tags = parseTags(formData);
    const song = await adminCreateSong({ slug, title, description, lyrics, explanation, labels, tags, published });

    revalidatePath("/controlpanel");
    revalidatePath("/");

    // If files need uploading, return slug + token for client-side direct upload
    if (hasFiles) {
      const token = await adminGetUploadToken(song.slug);
      return { slug: song.slug, uploadToken: token };
    }
  } catch (e) {
    return { error: (e as Error).message };
  }

  redirect("/controlpanel");
}

export async function updateSongAction(slug: string, formData: FormData) {
  await requireAdmin();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const lyrics = formData.get("lyrics") as string;
  const explanation = formData.get("explanation") as string;
  const published = formData.get("published") === "true";
  const hasFiles = formData.get("has_files") === "true";

  try {
    const labels = parseLabels(formData);
    const tags = parseTags(formData);
    await adminUpdateSong(slug, { title, description, lyrics, explanation, labels, tags, published });

    revalidatePath("/controlpanel");
    revalidatePath(`/songs/${slug}`);
    revalidatePath("/");

    if (hasFiles) {
      const token = await adminGetUploadToken(slug);
      return { slug, uploadToken: token };
    }
  } catch (e) {
    return { error: (e as Error).message };
  }

  redirect("/controlpanel");
}

export async function deleteSongAction(slug: string) {
  await requireAdmin();
  await adminDeleteSong(slug);
  revalidatePath("/controlpanel");
  revalidatePath("/");
  redirect("/controlpanel");
}

export async function reorderSongsAction(slugs: string[]) {
  await requireAdmin();
  await adminReorderSongs(slugs);
  revalidatePath("/controlpanel");
  revalidatePath("/");
}

export async function togglePublishAction(slug: string, published: boolean) {
  await requireAdmin();
  await adminUpdateSong(slug, { published });
  revalidatePath("/controlpanel");
  revalidatePath("/");
  revalidatePath(`/songs/${slug}`);
}
