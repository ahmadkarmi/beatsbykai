"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SongLabel } from "@/lib/types";
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

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string;
  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: "Invalid password" };
  }
  const jar = await cookies();
  jar.set("admin_token", process.env.WORKER_ADMIN_SECRET!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  redirect("/controlpanel");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete("admin_token");
  redirect("/controlpanel/login");
}

export async function createSongAction(formData: FormData) {
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
  await adminDeleteSong(slug);
  revalidatePath("/controlpanel");
  revalidatePath("/");
  redirect("/controlpanel");
}

export async function reorderSongsAction(slugs: string[]) {
  await adminReorderSongs(slugs);
  revalidatePath("/controlpanel");
  revalidatePath("/");
}

export async function togglePublishAction(slug: string, published: boolean) {
  await adminUpdateSong(slug, { published });
  revalidatePath("/controlpanel");
  revalidatePath("/");
  revalidatePath(`/songs/${slug}`);
}
