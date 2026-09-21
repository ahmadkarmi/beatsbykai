import type { Song } from "../types";

// Platform-specific slice of playback. Everything above this — queue,
// shuffle, repeat, milestones, analytics — is shared and lives in logic.ts.
//
// The web app drives an HTMLAudioElement plus the Media Session API; mobile
// will drive expo-audio. Swapping either (for example to @rntp/player, to get
// CarPlay and Android Auto) should touch only an implementation of this
// interface.

export type EngineStatus = {
  positionSec: number;
  /** 0 until known. */
  durationSec: number;
  isPlaying: boolean;
  isBuffering: boolean;
  isLoaded: boolean;
  /** True exactly once per natural end of track. */
  didJustFinish: boolean;
  /** Echoes the id given to load(), so stale status can be discarded. */
  trackId: string | null;
};

export type NowPlayingMeta = {
  title: string;
  artist: string;
  albumTitle: string;
  artworkUrl?: string;
};

export type RemoteCapabilities = { next: boolean; previous: boolean };

export type RemoteCommand =
  | { type: "play" }
  | { type: "pause" }
  | { type: "next" }
  | { type: "previous" }
  | { type: "seekTo"; positionSec: number }
  | { type: "seekBy"; offsetSec: number };

export interface PlayerEngine {
  /** Load a source. Must NOT autoplay. */
  load(trackId: string, url: string): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  /** Absolute seconds, not a fraction. */
  seekTo(positionSec: number): Promise<void>;
  onStatus(cb: (status: EngineStatus) => void): () => void;
  /** Lock screen, notification, headset, car controls. */
  onRemoteCommand(cb: (command: RemoteCommand) => void): () => void;
  /** Publish OS now-playing info, or clear it with null. */
  setNowPlaying(meta: NowPlayingMeta | null, caps: RemoteCapabilities): void;
  /** Lock-screen scrubber position. No-op where the engine derives it. */
  setPositionState(positionSec: number, durationSec: number, rate: number): void;
  dispose(): void;
}

/** Convenience for building now-playing metadata from a song. */
export function nowPlayingFor(
  song: Song,
  artist: string,
  albumTitle: string,
  fallbackArtwork?: string
): NowPlayingMeta {
  return {
    title: song.title,
    artist,
    albumTitle,
    artworkUrl: song.coverArtUrl || fallbackArtwork,
  };
}
