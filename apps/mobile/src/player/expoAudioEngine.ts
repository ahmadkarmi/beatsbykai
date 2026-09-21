import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from "expo-audio";
import type {
  EngineStatus,
  NowPlayingMeta,
  PlayerEngine,
  RemoteCapabilities,
  RemoteCommand,
} from "@beatsbykai/core";

// The ONLY file permitted to import from expo-audio. Everything above it
// speaks the platform-neutral PlayerEngine interface, so swapping the engine
// (for CarPlay / Android Auto via @rntp/player, say) touches this file alone.
//
// Verified against expo-audio 57.0.5's own type definitions:
//   AudioStatus.currentTime — "Current playback position in seconds"
//   AudioStatus.duration    — "Total duration of the audio in seconds, or 0"
//   AudioStatus.didJustFinish, .isBuffering, .isLoaded all present
// expo-av used milliseconds; this does not. No unit coercion is needed.

/**
 * 250ms rather than the 500ms default. The web scrubber and the mini player's
 * progress line update at the HTML5 `timeupdate` rate (~4Hz); at 500ms the
 * movement is visibly steppy by comparison.
 */
const UPDATE_INTERVAL_MS = 250;

/** Module scope on purpose: playback must outlive components and Fast Refresh. */
let player: AudioPlayer | null = null;
let currentTrackId: string | null = null;

const statusListeners = new Set<(s: EngineStatus) => void>();
const remoteListeners = new Set<(c: RemoteCommand) => void>();

let subscription: { remove(): void } | null = null;

function toEngineStatus(s: AudioStatus): EngineStatus {
  return {
    positionSec: s.currentTime ?? 0,
    durationSec: Number.isFinite(s.duration) ? s.duration : 0,
    isPlaying: s.playing,
    isBuffering: s.isBuffering,
    isLoaded: s.isLoaded,
    didJustFinish: s.didJustFinish,
    trackId: currentTrackId,
  };
}

function ensurePlayer(): AudioPlayer {
  if (player) return player;

  player = createAudioPlayer(null, { updateInterval: UPDATE_INTERVAL_MS });

  subscription = player.addListener("playbackStatusUpdate", (s: AudioStatus) => {
    const mapped = toEngineStatus(s);
    for (const cb of statusListeners) cb(mapped);
  });

  return player;
}

/**
 * Call once, before playback. Required on Android for background audio to
 * survive more than a few minutes, and `doNotMix` is mandatory when lock
 * screen controls are enabled.
 */
export async function configureAudioSession(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: "doNotMix",
  });
}

export const expoAudioEngine: PlayerEngine = {
  async load(trackId, url) {
    const p = ensurePlayer();
    currentTrackId = trackId;
    // Never use p.loop for repeat-one: native looping suppresses
    // didJustFinish, which would silently break the milestone reset and stop
    // song_complete firing on a second pass.
    p.loop = false;
    p.replace({ uri: url });
  },

  async play() {
    ensurePlayer().play();
  },

  pause() {
    player?.pause();
  },

  async seekTo(positionSec) {
    const p = player;
    if (!p) return;
    await p.seekTo(Math.max(0, positionSec));
  },

  onStatus(cb) {
    statusListeners.add(cb);
    return () => statusListeners.delete(cb);
  },

  onRemoteCommand(cb) {
    // Nothing to forward yet, and that is correct rather than incomplete:
    // expo-audio 57 handles play / pause / toggle / seek natively on the
    // player and emits no JS events for them, so the OS controls drive
    // playback directly and our status subscription observes the result.
    //
    // Next / previous are the exception — they do not exist at all in this
    // version's AudioLockScreenOptions. When the expo#43538 patch lands, its
    // onRemoteNextTrack / onRemotePreviousTrack events get translated to
    // RemoteCommand here and nowhere else.
    remoteListeners.add(cb);
    return () => remoteListeners.delete(cb);
  },

  setNowPlaying(meta: NowPlayingMeta | null, _caps: RemoteCapabilities) {
    const p = player;
    if (!p) return;

    if (!meta) {
      p.setActiveForLockScreen(false);
      return;
    }

    // Required on Android, not optional polish: without it the foreground
    // service is not kept alive and playback stops after roughly three
    // minutes in the background (OS limitation, per expo-audio's own docs).
    //
    // `caps` is ignored for now. expo-audio 57's AudioLockScreenOptions has
    // no next/previous fields — that is what the expo#43538 patch adds.
    p.setActiveForLockScreen(
      true,
      {
        title: meta.title,
        artist: meta.artist,
        albumTitle: meta.albumTitle,
        artworkUrl: meta.artworkUrl,
      },
      { showSeekForward: true, showSeekBackward: true }
    );
  },

  setPositionState() {
    // No-op: expo-audio derives the lock-screen scrubber from the player
    // itself. Kept on the interface because the web Media Session engine and
    // @rntp/player both need it.
  },

  dispose() {
    subscription?.remove();
    subscription = null;
    statusListeners.clear();
    remoteListeners.clear();
    player?.remove();
    player = null;
    currentTrackId = null;
  },
};
