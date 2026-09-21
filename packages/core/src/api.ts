import type { Song } from "./types";

export type SongsClientOptions = {
  /** Worker base URL. Undefined behaves exactly as an unreachable API. */
  baseUrl: string | undefined;
  timeoutMs?: number;
  /**
   * Extra fetch options. The web app passes Next's `{ next: { revalidate } }`
   * through here so this module stays free of framework types.
   */
  init?: RequestInit;
};

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Read-only client for the public Worker endpoints.
 *
 * Degrades to empty rather than throwing: a failed fetch, a non-2xx, a
 * timeout or an unconfigured base URL all surface as "no songs", so the
 * library renders an empty state instead of an error page.
 */
export function createSongsClient(options: SongsClientOptions) {
  const { baseUrl, timeoutMs = DEFAULT_TIMEOUT_MS, init } = options;

  async function get<T>(path: string): Promise<T | null> {
    if (!baseUrl) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${baseUrl}${path}`, { ...init, signal: controller.signal });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async getPublishedSongs(): Promise<Song[]> {
      return (await get<Song[]>("/songs")) ?? [];
    },
    async getSongBySlug(slug: string): Promise<Song | undefined> {
      return (await get<Song>(`/songs/${slug}`)) ?? undefined;
    },
  };
}

export type SongsClient = ReturnType<typeof createSongsClient>;
