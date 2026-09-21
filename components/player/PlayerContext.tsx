"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Song, RepeatMode } from "@/lib/types";
import {
  trackSongComplete,
  trackSongPlay,
  trackSongSkipped,
  trackSongMilestone,
  trackSongSeeked,
  trackNextTrack,
  trackPrevTrack,
  trackShuffleToggled,
  trackRepeatChanged,
  type PlaySource,
} from "@/lib/analytics";

export type { RepeatMode };

type PlayerState = {
  currentSong: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  queue: Song[];
  activeQueue: Song[]; // shuffle-aware queue for consumers
  shuffle: boolean;
  repeat: RepeatMode;
};

type PlayerContextType = PlayerState & {
  play: (song: Song, source?: PlaySource) => void;
  pause: () => void;
  resume: () => void;
  seekTo: (progress: number) => void;
  setQueue: (songs: Song[]) => void;
  playNext: (source?: "next_button" | "auto_advance") => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueueState] = useState<Song[]>([]);
  const [shuffledQueue, setShuffledQueue] = useState<Song[]>([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("all");

  // Always-current refs to avoid stale closures in audio callbacks.
  //
  // Assigned in an effect rather than during render. Every reader is an async
  // callback that runs well after commit — the audio element's own events and
  // the Media Session handlers — so post-paint assignment is soon enough, and
  // the initial useRef() values are already correct for the first frame.
  // Writing refs during render is unsafe under StrictMode's double render and
  // under concurrent rendering, where a render can be thrown away.
  const currentSongRef = useRef(currentSong);
  const queueRef = useRef(queue);
  const shuffledQueueRef = useRef(shuffledQueue);
  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeat);

  useEffect(() => {
    currentSongRef.current = currentSong;
    queueRef.current = queue;
    shuffledQueueRef.current = shuffledQueue;
    shuffleRef.current = shuffle;
    repeatRef.current = repeat;
  });

  // The queue consumers should use for prev/next/ordering
  const activeQueue = shuffle ? shuffledQueue : queue;

  // Ref to play() so onEnded can call it without recreating the listener
  const playRef = useRef<(song: Song, source?: PlaySource) => void>(() => {});

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setProgress(audio.currentTime / audio.duration);
      }
    };
    const onDurationChange = () => {
      if (!isNaN(audio.duration)) setDuration(audio.duration);
    };
    const onEnded = () => {
      setProgress(0);
      const cur = currentSongRef.current;
      const repeatMode = repeatRef.current;
      const q = shuffleRef.current ? shuffledQueueRef.current : queueRef.current;

      // Repeat one: restart
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      if (!cur || q.length === 0) { setIsPlaying(false); return; }

      const idx = q.findIndex((s) => s.id === cur.id);
      const isLast = idx === q.length - 1;

      if (!isLast) {
        // Auto-advance to next
        playRef.current(q[idx + 1], "auto_advance");
      } else if (repeatMode === "all") {
        // Loop back to first
        playRef.current(q[0], "auto_advance");
      } else {
        // End of queue, stop
        setIsPlaying(false);
      }
    };
    const onPlay = () => { setIsPlaying(true); setIsLoading(false); };
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.pause();
    };
  }, []);

  // Milestone and completion tracking
  const completedRef = useRef(false);
  const milestonesRef = useRef(new Set<number>());

  useEffect(() => {
    if (!currentSong) return;
    const pct = progress * 100;

    for (const milestone of [25, 50, 75] as const) {
      if (pct >= milestone && !milestonesRef.current.has(milestone)) {
        milestonesRef.current.add(milestone);
        trackSongMilestone(currentSong.title, currentSong.slug, milestone);
      }
    }

    if (progress >= 0.95 && !completedRef.current) {
      completedRef.current = true;
      trackSongComplete(currentSong.title, currentSong.slug);
    }

    if (progress < 0.05) {
      completedRef.current = false;
      milestonesRef.current.clear();
    }
  }, [progress, currentSong]);

  const play = useCallback(
    (song: Song, source: PlaySource = "song_page") => {
      const audio = audioRef.current;
      if (!audio) return;

      if (!song.mp3Url) {
        setCurrentSong(song);
        setProgress(0);
        setDuration(0);
        setIsLoading(false);
        return;
      }

      if (currentSongRef.current?.id === song.id) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      setIsLoading(true);

      // Track skip if previous song hadn't hit 95%
      const prev = currentSongRef.current;
      const prevProgress = audio.duration ? audio.currentTime / audio.duration : 0;
      if (prev && prevProgress > 0.05 && prevProgress < 0.95) {
        trackSongSkipped(prev.title, prev.slug, String(Math.round(prevProgress * 100)));
      }

      // Reset milestone state for new song
      milestonesRef.current.clear();
      completedRef.current = false;

      audio.src = song.mp3Url;
      audio.load();
      audio.play()
        .then(() => trackSongPlay(song.title, song.slug, song.labels ?? [], source))
        .catch(() => { setIsLoading(false); });

      setCurrentSong(song);
      setProgress(0);
      setDuration(0);
    },
    [] // no deps — reads via refs
  );

  // Keep playRef current so onEnded always has the latest play(). The `ended`
  // listener is registered once on mount but never fires before this lands.
  useEffect(() => {
    playRef.current = play;
  }, [play]);

  // ── Media Session API ──────────────────────────────────────────
  // Pushes song metadata + controls to OS, car displays, lock screen, BT
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (!currentSong) {
      navigator.mediaSession.metadata = null;
      return;
    }
    const coverUrl = currentSong.coverArtUrl;
    const mimeType = coverUrl
      ? coverUrl.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg"
      : "image/png";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: "Kai",
      album: "beatsbykai.com",
      artwork: coverUrl
        ? [
            { src: coverUrl, sizes: "96x96",   type: mimeType },
            { src: coverUrl, sizes: "128x128",  type: mimeType },
            { src: coverUrl, sizes: "256x256",  type: mimeType },
            { src: coverUrl, sizes: "512x512",  type: mimeType },
          ]
        : [{ src: "https://www.beatsbykai.com/BeatsByKaiDarkBG.png", sizes: "512x512", type: "image/png" }],
    });
  }, [currentSong]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // Keep position state current so car display shows a scrubber
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const audio = audioRef.current;
    if (!audio || !duration || isNaN(duration)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: audio.playbackRate,
        position: Math.min(progress * duration, duration),
      });
    } catch {
      // Some browsers throw if position > duration during race conditions
    }
  }, [progress, duration]);

  const pause = useCallback(() => { audioRef.current?.pause(); }, []);
  const resume = useCallback(() => { audioRef.current?.play().catch(() => {}); }, []);

  const seekTo = useCallback((p: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || isNaN(audio.duration)) return;
    const from = audio.duration ? audio.currentTime / audio.duration : 0;
    audio.currentTime = p * audio.duration;
    setProgress(p);
    const song = currentSongRef.current;
    if (song) {
      trackSongSeeked(song.title, song.slug, String(Math.round(from * 100)), String(Math.round(p * 100)));
    }
  }, []);

  const setQueue = useCallback((songs: Song[]) => {
    setQueueState(songs);
    // Rebuild shuffled queue if shuffle is active
    if (shuffleRef.current) {
      const cur = currentSongRef.current;
      const others = songs.filter((s) => s.id !== cur?.id);
      const shuffled = shuffleArray(others);
      setShuffledQueue(cur ? [cur, ...shuffled] : shuffled);
    }
  }, []);

  const playNext = useCallback((source: "next_button" | "auto_advance" = "next_button") => {
    const q = shuffleRef.current ? shuffledQueueRef.current : queueRef.current;
    const cur = currentSongRef.current;
    if (!cur || q.length === 0) return;
    const idx = q.findIndex((s) => s.id === cur.id);
    trackNextTrack(cur.title, cur.slug, source);
    if (idx !== -1 && idx < q.length - 1) {
      play(q[idx + 1], source);
    } else if (repeatRef.current !== "off" && q.length > 0) {
      // repeat-all or repeat-one: loop to first (repeat-one manual next = skip to first)
      play(q[0], source);
    }
  }, [play]);

  const playPrevious = useCallback(() => {
    const audio = audioRef.current;
    const q = shuffleRef.current ? shuffledQueueRef.current : queueRef.current;
    const cur = currentSongRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setProgress(0);
      if (cur) trackPrevTrack(cur.title, cur.slug, "restart");
      return;
    }
    if (!cur || q.length === 0) return;
    const idx = q.findIndex((s) => s.id === cur.id);
    if (idx > 0) {
      trackPrevTrack(cur.title, cur.slug, "prev_song");
      play(q[idx - 1], "prev_button");
    }
  }, [play]);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const next = !prev;
      if (next) {
        // Build shuffled queue, keeping current song at position 0
        const cur = currentSongRef.current;
        const q = queueRef.current;
        const others = q.filter((s) => s.id !== cur?.id);
        const shuffled = shuffleArray(others);
        setShuffledQueue(cur ? [cur, ...shuffled] : shuffled);
      }
      trackShuffleToggled(next);
      return next;
    });
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeat((prev) => {
      const next: RepeatMode = prev === "off" ? "all" : prev === "all" ? "one" : "off";
      trackRepeatChanged(next);
      return next;
    });
  }, []);

  // Media Session action handlers — lock screen, notification, headset, car.
  // Declared after the transport callbacks so they can be real dependencies.
  // Routing through playNext/playPrevious/seekTo rather than driving the audio
  // element directly is what makes remote controls honour shuffle and repeat,
  // and emit the same analytics as the on-screen transport.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;

    ms.setActionHandler("play", () => resume());
    ms.setActionHandler("pause", () => pause());
    ms.setActionHandler("nexttrack", () => playNext("next_button"));
    ms.setActionHandler("previoustrack", () => playPrevious());

    // seekTo() takes a 0..1 fraction; the Media Session API speaks seconds.
    const seekSeconds = (seconds: number) => {
      const audio = audioRef.current;
      if (!audio || !audio.duration || isNaN(audio.duration)) return;
      seekTo(Math.max(0, Math.min(audio.duration, seconds)) / audio.duration);
    };

    ms.setActionHandler("seekto", (d) => {
      if (d.seekTime == null) return;
      seekSeconds(d.seekTime);
    });
    ms.setActionHandler("seekbackward", (d) => {
      const audio = audioRef.current;
      if (audio) seekSeconds(audio.currentTime - (d.seekOffset ?? 10));
    });
    ms.setActionHandler("seekforward", (d) => {
      const audio = audioRef.current;
      if (audio) seekSeconds(audio.currentTime + (d.seekOffset ?? 10));
    });

    return () => {
      const actions = [
        "play", "pause", "nexttrack", "previoustrack",
        "seekto", "seekbackward", "seekforward",
      ] as const;
      for (const action of actions) ms.setActionHandler(action, null);
    };
  }, [resume, pause, playNext, playPrevious, seekTo]);

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
