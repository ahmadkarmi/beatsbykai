import { Song } from "@/lib/types";

const WORKER_URL = process.env.WORKER_URL;

// Falls back to null if Worker is not configured or times out
async function fetchFromWorker<T>(path: string): Promise<T | null> {
  if (!WORKER_URL) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${WORKER_URL}${path}`, {
      next: { revalidate: 60 },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function getPublishedSongs(): Promise<Song[]> {
  const songs = await fetchFromWorker<Song[]>("/songs");
  return songs ?? [];
}

export async function getSongBySlug(slug: string): Promise<Song | undefined> {
  const song = await fetchFromWorker<Song>(`/songs/${slug}`);
  return song ?? undefined;
}
