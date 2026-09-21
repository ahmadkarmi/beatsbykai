const WORKER_URL = process.env.WORKER_URL!;
const ADMIN_SECRET = process.env.WORKER_ADMIN_SECRET!;

function adminHeaders(extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${ADMIN_SECRET}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

import type { SongLabel } from "@beatsbykai/core";

export type AdminSong = {
  id: string;
  slug: string;
  title: string;
  description: string;
  mp3Url: string;
  coverArtUrl: string;
  mp3Key: string;
  coverKey: string;
  lyrics: string;
  explanation?: string;
  labels: SongLabel[];
  tags: string[];
  published: boolean;
  createdAt: string;
};

export async function adminListSongs(): Promise<AdminSong[]> {
  const res = await fetch(`${WORKER_URL}/admin/songs`, {
    headers: adminHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch songs");
  return res.json();
}

export async function adminGetSong(slug: string): Promise<AdminSong | null> {
  const songs = await adminListSongs();
  return songs.find((s) => s.slug === slug) ?? null;
}

export async function adminCreateSong(data: {
  slug: string;
  title: string;
  description: string;
  lyrics: string;
  explanation: string;
  labels: SongLabel[];
  tags: string[];
  published: boolean;
}): Promise<AdminSong> {
  const res = await fetch(`${WORKER_URL}/songs`, {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json() as { error: string };
    throw new Error(err.error ?? "Failed to create song");
  }
  return res.json();
}

export async function adminUpdateSong(
  slug: string,
  data: Partial<{
    title: string;
    description: string;
    lyrics: string;
    explanation: string;
    labels: SongLabel[];
    tags: string[];
    published: boolean;
  }>
): Promise<AdminSong> {
  const res = await fetch(`${WORKER_URL}/songs/${slug}`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json() as { error: string };
    throw new Error(err.error ?? "Failed to update song");
  }
  return res.json();
}

export async function adminDeleteSong(slug: string): Promise<void> {
  const res = await fetch(`${WORKER_URL}/songs/${slug}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete song");
}

export async function adminReorderSongs(slugs: string[]): Promise<void> {
  const res = await fetch(`${WORKER_URL}/admin/songs/reorder`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify({ slugs }),
  });
  if (!res.ok) throw new Error("Failed to reorder songs");
}

export async function adminGetUploadToken(slug: string): Promise<string> {
  const res = await fetch(`${WORKER_URL}/songs/${slug}/upload-token`, {
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error("Failed to get upload token");
  const data = await res.json() as { token: string };
  return data.token;
}
