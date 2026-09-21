import type { RepeatMode, Song } from "../types";

// Pure decisions behind the player. Every branch here was previously inline in
// the web PlayerContext; extracting them means both apps share one definition
// and the behaviour is testable without a browser or a device.

/** Past this point, "previous" restarts the track instead of going back one. */
export const RESTART_THRESHOLD_SEC = 3;
/** Progress at which a play counts as completed. */
export const COMPLETE_THRESHOLD = 0.95;
/** Below this, milestone state resets so a re-listen fires them again. */
export const RESET_THRESHOLD = 0.05;
/** Leaving a track between these bounds counts as a skip, not a completion. */
export const SKIP_MIN = 0.05;
export const SKIP_MAX = 0.95;

export const MILESTONES = [25, 50, 75] as const;
export type Milestone = (typeof MILESTONES)[number];

/** Fisher-Yates. Non-mutating. */
export function shuffleArray<T>(input: readonly T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Shuffled order with the current track pinned at index 0, so turning shuffle
 * on never interrupts what is already playing.
 */
export function buildShuffledQueue(songs: readonly Song[], current: Song | null): Song[] {
  const others = songs.filter((s) => s.id !== current?.id);
  const shuffled = shuffleArray(others);
  return current ? [current, ...shuffled] : shuffled;
}

export type EndedResolution =
  | { action: "restart" }
  | { action: "play"; song: Song }
  | { action: "stop" };

/** What to do when a track reaches its natural end. */
export function resolveEnded(
  queue: readonly Song[],
  currentId: string | undefined,
  repeat: RepeatMode
): EndedResolution {
  if (repeat === "one") return { action: "restart" };
  if (!currentId || queue.length === 0) return { action: "stop" };

  const idx = queue.findIndex((s) => s.id === currentId);
  if (idx === -1) return { action: "stop" };

  const isLast = idx === queue.length - 1;
  if (!isLast) return { action: "play", song: queue[idx + 1] };
  if (repeat === "all") return { action: "play", song: queue[0] };
  return { action: "stop" };
}

/**
 * Target for an explicit "next". Unlike end-of-track, repeat-one here means
 * the listener asked to move on, so it wraps rather than restarting.
 */
export function resolveNext(
  queue: readonly Song[],
  currentId: string | undefined,
  repeat: RepeatMode
): Song | null {
  if (!currentId || queue.length === 0) return null;
  const idx = queue.findIndex((s) => s.id === currentId);
  if (idx === -1) return null;
  if (idx < queue.length - 1) return queue[idx + 1];
  return repeat !== "off" ? queue[0] : null;
}

export type PreviousResolution =
  | { action: "restart" }
  | { action: "play"; song: Song }
  | { action: "none" };

/** Restart if we are past the threshold, otherwise step back one. */
export function resolvePrevious(
  queue: readonly Song[],
  currentId: string | undefined,
  positionSec: number
): PreviousResolution {
  if (positionSec > RESTART_THRESHOLD_SEC) return { action: "restart" };
  if (!currentId || queue.length === 0) return { action: "none" };

  const idx = queue.findIndex((s) => s.id === currentId);
  if (idx > 0) return { action: "play", song: queue[idx - 1] };
  return { action: "none" };
}

/** Milestones newly crossed at this progress that have not fired yet. */
export function crossedMilestones(
  progress: number,
  alreadyFired: ReadonlySet<number>
): Milestone[] {
  const pct = progress * 100;
  return MILESTONES.filter((m) => pct >= m && !alreadyFired.has(m));
}

/** Leaving a track at this progress counts as a skip. */
export function isSkip(progress: number): boolean {
  return progress > SKIP_MIN && progress < SKIP_MAX;
}

/** mm:ss. Guards NaN and the not-yet-loaded zero state. */
export function formatTime(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
