import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  COMPLETE_THRESHOLD,
  RESET_THRESHOLD,
  buildShuffledQueue,
  crossedMilestones,
  isSkip,
  resolveEnded,
  resolveNext,
  resolvePrevious,
  type EngineStatus,
  type PlaySource,
  type RepeatMode,
  type Song,
} from "@beatsbykai/core";
import { configureAudioSession, expoAudioEngine as engine } from "./expoAudioEngine";
import { analytics } from "@/lib/analytics";

// Port of apps/web/components/player/PlayerContext.tsx. The public API is
// deliberately identical — `progress` is a 0..1 FRACTION, `duration` is
// SECONDS, `seekTo` takes a fraction — so every consumer expression ported
// from web copies across unchanged. Conversion happens only at the engine
// boundary, which is the single biggest footgun in this file.

type PlayerState = {
  currentSong: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  /** 0..1 fraction, NOT seconds. */
  progress: number;
  /** Seconds. */
  duration: number;
  queue: Song[];
  activeQueue: Song[];
  shuffle: boolean;
  repeat: RepeatMode;
};

type PlayerContextType = PlayerState & {
  play: (song: Song, source?: PlaySource) => void;
  pause: () => void;
  resume: () => void;
  /** Takes a 0..1 fraction. */
  seekTo: (progress: number) => void;
  setQueue: (songs: Song[]) => void;
  playNext: (source?: "next_button" | "auto_advance") => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueueState] = useState<Song[]>([]);
  const [shuffledQueue, setShuffledQueue] = useState<Song[]>([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("all");

  const activeQueue = shuffle ? shuffledQueue : queue;

  // Mirror refs. The status listener is registered once, so it would
  // otherwise capture the first render's values forever.
  //
  // Assigned in an effect, never during render — matching the web app after
  // its own fix. Every reader here is an async callback that runs after
  // commit, and render-phase ref writes break under StrictMode's double
  // render. lastStatusRef replaces every direct read of engine position.
  const currentSongRef = useRef(currentSong);
  const queueRef = useRef(queue);
  const shuffledQueueRef = useRef(shuffledQueue);
  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeat);
  const durationRef = useRef(duration);
  const lastStatusRef = useRef<EngineStatus | null>(null);
  const playRef = useRef<(song: Song, source?: PlaySource) => void>(() => {});

  useEffect(() => {
    currentSongRef.current = currentSong;
    queueRef.current = queue;
    shuffledQueueRef.current = shuffledQueue;
    shuffleRef.current = shuffle;
    repeatRef.current = repeat;
    durationRef.current = duration;
  });

  const milestonesRef = useRef(new Set<number>());
  const completedRef = useRef(false);
  /** Guards against didJustFinish being observed on more than one tick. */
  const endedHandledRef = useRef<string | null>(null);

  useEffect(() => {
    configureAudioSession().catch(() => {
      // Playback still works without the preferred session config; it just
      // may not survive backgrounding. Not worth blocking startup.
    });
  }, []);

  // ── Engine status → state ────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = engine.onStatus((status) => {
      lastStatusRef.current = status;

      setDuration(status.durationSec);
      setProgress(status.durationSec > 0 ? status.positionSec / status.durationSec : 0);
      setIsPlaying(status.isPlaying);
      if (status.isLoaded || status.isPlaying) setIsLoading(false);

      if (!status.didJustFinish) return;

      // Unlike the DOM's one-shot `ended` event this is a flag on a polled
      // status, so it can in principle be seen twice for the same track.
      const cur = currentSongRef.current;
      if (!cur || endedHandledRef.current === cur.id) return;
      endedHandledRef.current = cur.id;

      setProgress(0);
      const q = shuffleRef.current ? shuffledQueueRef.current : queueRef.current;
      const outcome = resolveEnded(q, cur.id, repeatRef.current);

      if (outcome.action === "restart") {
        // repeat-one is implemented here, NOT via engine looping.
        engine.seekTo(0).then(() => engine.play()).catch(() => {});
        endedHandledRef.current = null;
        return;
      }
      if (outcome.action === "play") {
        playRef.current(outcome.song, "auto_advance");
        return;
      }
      setIsPlaying(false);
    });

    return unsubscribe;
  }, []);

  // ── Milestones + completion ──────────────────────────────────────────────
  useEffect(() => {
    if (!currentSong) return;

    for (const m of crossedMilestones(progress, milestonesRef.current)) {
      milestonesRef.current.add(m);
      analytics.trackSongMilestone(currentSong.title, currentSong.slug, m);
    }

    if (progress >= COMPLETE_THRESHOLD && !completedRef.current) {
      completedRef.current = true;
      analytics.trackSongComplete(currentSong.title, currentSong.slug);
    }

    if (progress < RESET_THRESHOLD) {
      completedRef.current = false;
      milestonesRef.current.clear();
    }
  }, [progress, currentSong]);

  const play = useCallback((song: Song, source: PlaySource = "song_page") => {
    // No audio: show the song, play nothing, touch the engine not at all.
    if (!song.mp3Url) {
      setCurrentSong(song);
      setProgress(0);
      setDuration(0);
      setIsLoading(false);
      return;
    }

    // Same song: restart rather than reload.
    if (currentSongRef.current?.id === song.id) {
      engine.seekTo(0).then(() => engine.play()).catch(() => {});
      return;
    }

    // Leaving the previous track mid-way counts as a skip.
    const prev = currentSongRef.current;
    const last = lastStatusRef.current;
    if (prev && last && last.durationSec > 0) {
      const prevProgress = last.positionSec / last.durationSec;
      if (isSkip(prevProgress)) {
        analytics.trackSongSkipped(
          prev.title,
          prev.slug,
          String(Math.round(prevProgress * 100))
        );
      }
    }

    milestonesRef.current.clear();
    completedRef.current = false;
    endedHandledRef.current = null;

    setIsLoading(true);
    setCurrentSong(song);
    setProgress(0);
    setDuration(0);

    engine
      .load(song.id, song.mp3Url)
      .then(() => engine.play())
      .then(() => analytics.trackSongPlay(song.title, song.slug, song.labels ?? [], source))
      .catch(() => setIsLoading(false));
  }, []);

  // Declared after play() so the React Compiler can see the ordering; the
  // once-registered status listener calls through this ref to reach the
  // latest play() without being re-registered.
  useEffect(() => {
    playRef.current = play;
  }, [play]);

  const pause = useCallback(() => engine.pause(), []);
  const resume = useCallback(() => {
    engine.play().catch(() => {});
  }, []);

  const seekTo = useCallback((p: number) => {
    const dur = durationRef.current;
    const song = currentSongRef.current;
    if (!dur || Number.isNaN(dur)) return;

    const from = lastStatusRef.current
      ? lastStatusRef.current.positionSec / Math.max(dur, 1)
      : 0;

    engine.seekTo(p * dur).catch(() => {});
    setProgress(p);

    if (song) {
      analytics.trackSongSeeked(
        song.title,
        song.slug,
        String(Math.round(from * 100)),
        String(Math.round(p * 100))
      );
    }
  }, []);

  const setQueue = useCallback((songs: Song[]) => {
    setQueueState(songs);
    if (shuffleRef.current) {
      setShuffledQueue(buildShuffledQueue(songs, currentSongRef.current));
    }
  }, []);

  const playNext = useCallback(
    (source: "next_button" | "auto_advance" = "next_button") => {
      const q = shuffleRef.current ? shuffledQueueRef.current : queueRef.current;
      const cur = currentSongRef.current;
      if (!cur) return;

      const target = resolveNext(q, cur.id, repeatRef.current);
      if (!target) return;

      analytics.trackNextTrack(cur.title, cur.slug, source);
      play(target, source);
    },
    [play]
  );

  const playPrevious = useCallback(() => {
    const q = shuffleRef.current ? shuffledQueueRef.current : queueRef.current;
    const cur = currentSongRef.current;
    const pos = lastStatusRef.current?.positionSec ?? 0;

    const outcome = resolvePrevious(q, cur?.id, pos);

    if (outcome.action === "restart") {
      engine.seekTo(0).catch(() => {});
      setProgress(0);
      if (cur) analytics.trackPrevTrack(cur.title, cur.slug, "restart");
      return;
    }
    if (outcome.action === "play" && cur) {
      analytics.trackPrevTrack(cur.title, cur.slug, "prev_song");
      play(outcome.song, "prev_button");
    }
  }, [play]);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const next = !prev;
      if (next) {
        setShuffledQueue(buildShuffledQueue(queueRef.current, currentSongRef.current));
      }
      analytics.trackShuffleToggled(next);
      return next;
    });
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeat((prev) => {
      const next: RepeatMode = prev === "off" ? "all" : prev === "all" ? "one" : "off";
      analytics.trackRepeatChanged(next);
      return next;
    });
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        isLoading,
        progress,
        duration,
        queue,
        activeQueue,
        shuffle,
        repeat,
        play,
        pause,
        resume,
        seekTo,
        setQueue,
        playNext,
        playPrevious,
        toggleShuffle,
        cycleRepeat,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextType {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
