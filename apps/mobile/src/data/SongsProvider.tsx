import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { createSongsClient, type Song } from "@beatsbykai/core";

const CACHE_KEY = "kai.songs.v1";

type CachedSongs = { v: 1; songs: Song[]; fetchedAt: number };

const workerUrl = Constants.expoConfig?.extra?.workerUrl as string | undefined;
const client = createSongsClient({ baseUrl: workerUrl });

type SongsState = {
  songs: Song[];
  /** True only until the first render that has songs from anywhere. */
  loading: boolean;
  /** The last refresh failed and what is on screen came from cache. */
  stale: boolean;
  refresh: () => Promise<void>;
  getBySlug: (slug: string) => Song | undefined;
};

const SongsContext = createContext<SongsState | null>(null);

/**
 * Cache-first song list.
 *
 * The catalogue is small and changes rarely, so the app renders whatever was
 * cached immediately and refreshes behind it. That also makes a cold, offline
 * launch useful instead of empty — and it is a prerequisite for restoring the
 * last played track later, which cannot resolve a song id without a list.
 *
 * Metadata only. No audio is cached; this is not offline playback.
 */
export function SongsProvider({ children }: { children: React.ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const fresh = await client.getPublishedSongs();
    if (!mounted.current) return;

    // The client swallows failures and returns []. An empty result is
    // therefore ambiguous, so treat it as a failed refresh rather than
    // wiping a good cache — a genuinely empty catalogue is not a real state.
    if (fresh.length === 0) {
      setStale(true);
      return;
    }

    setSongs(fresh);
    setStale(false);
    setLoading(false);
    AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ v: 1, songs: fresh, fetchedAt: Date.now() } satisfies CachedSongs)
    ).catch(() => {
      // A failed cache write is not worth surfacing; the next launch just
      // starts from the network instead.
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as CachedSongs;
          if (parsed?.v === 1 && Array.isArray(parsed.songs) && parsed.songs.length > 0) {
            setSongs(parsed.songs);
            setLoading(false);
          }
        }
      } catch {
        // Unreadable or malformed cache. Fall through to the network.
      }
      if (!cancelled) {
        await refresh();
        if (!cancelled && mounted.current) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const getBySlug = useCallback(
    (slug: string) => songs.find((s) => s.slug === slug),
    [songs]
  );

  return (
    <SongsContext.Provider value={{ songs, loading, stale, refresh, getBySlug }}>
      {children}
    </SongsContext.Provider>
  );
}

export function useSongs(): SongsState {
  const ctx = useContext(SongsContext);
  if (!ctx) throw new Error("useSongs must be used inside SongsProvider");
  return ctx;
}
