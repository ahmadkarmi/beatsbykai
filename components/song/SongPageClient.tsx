"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/components/player/PlayerContext";
import type { RepeatMode } from "@/components/player/PlayerContext";
import { Song } from "@/lib/types";
import { trackSongPageView } from "@/lib/analytics";
import ShareButton from "@/components/song/ShareButton";
import type { SongLabel } from "@/lib/types";

const LABEL_STYLES: Record<SongLabel, string> = {
  new:      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  trending: "bg-amber-500/15  text-amber-400  border border-amber-500/25",
  featured: "bg-violet-500/15 text-violet-400 border border-violet-500/25",
};

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SongPageClient({ song, allSongs }: { song: Song; allSongs: Song[] }) {
  const router = useRouter();
  const {
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
  } = usePlayer();

  // Fix #2 & #14: populate queue on direct navigation / hard refresh
  useEffect(() => {
    if (queue.length === 0) setQueue(allSongs);
  }, [allSongs, queue.length, setQueue]);

  const isCurrentSong = currentSong?.id === song.id;

  // Use activeQueue (shuffle-aware) for prev/next navigation
  const effectiveQueue = activeQueue.length > 0 ? activeQueue : allSongs;
  const currentIndex = effectiveQueue.findIndex((s) => s.id === song.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < effectiveQueue.length - 1;
  const prevSong = hasPrevious ? effectiveQueue[currentIndex - 1] : null;
  const nextSong = hasNext ? effectiveQueue[currentIndex + 1] : null;

  const scrubRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [scrubProgress, setScrubProgress] = useState<number | null>(null);
  const [desktopTab, setDesktopTab] = useState<"lyrics" | "kaisays">(
    song.lyrics ? "lyrics" : "kaisays"
  );
  const [bottomSheet, setBottomSheet] = useState<"lyrics" | "kaisays" | null>(null);

  // Track the previous currentSong so we can detect auto-advance
  const prevCurrentSongIdRef = useRef<string | undefined>(currentSong?.id);
  useEffect(() => {
    const prev = prevCurrentSongIdRef.current;
    prevCurrentSongIdRef.current = currentSong?.id;
    // If the song that was playing on THIS page just changed to a new song, navigate
    if (currentSong && prev === song.id && currentSong.id !== song.id) {
      router.push(`/songs/${currentSong.slug}`);
    }
  }, [currentSong?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    trackSongPageView(song.title, song.slug);
  }, [song.title, song.slug]);

  const handlePlayPause = () => {
    if (isCurrentSong) {
      isPlaying ? pause() : resume();
    } else {
      play(song, "song_page");
    }
  };

  const handleNext = () => {
    // Use the page's song position, not currentSong, to determine target
    const target = nextSong ?? (repeat !== "off" ? effectiveQueue[0] : null);
    if (!target) return;
    play(target, "next_button");
    router.push(`/songs/${target.slug}`);
  };

  const handlePrevious = () => {
    if (!prevSong) return;
    const currentTime = isCurrentSong ? progress * duration : 0;
    // If past 3s just restart, don't navigate
    if (isCurrentSong && currentTime > 3) {
      playPrevious();
      return;
    }
    playPrevious();
    router.push(`/songs/${prevSong.slug}`);
  };

  const getProgressFromClientX = (clientX: number) => {
    const el = scrubRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const onScrubPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isCurrentSong) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setScrubProgress(getProgressFromClientX(e.clientX));
  };

  const onScrubPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    setScrubProgress(getProgressFromClientX(e.clientX));
  };

  const onScrubPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const p = getProgressFromClientX(e.clientX);
    setScrubProgress(null);
    seekTo(p);
  };

  const displayProgress = scrubProgress !== null ? scrubProgress : (isCurrentSong ? progress : 0);
  const currentTime = isCurrentSong ? progress * duration : 0;
  const displayDuration = isCurrentSong ? duration : 0;
  const isActive = isCurrentSong && isPlaying;
  const noAudio = !song.mp3Url;

  return (
    <div className="fixed inset-0 bg-black">

      {/* Scroll container — mobile scrolls here; desktop locks overflow and each column scrolls */}
      <div className="relative z-10 h-full overflow-y-auto lg:overflow-hidden">
        <div
          className="max-w-lg mx-auto lg:max-w-none lg:mx-0 lg:flex lg:h-full"
          style={{ minHeight: "calc(100dvh - 3.5rem)" }}
        >

          {/* ══ LEFT: Player panel ══ */}
          <div className="lg:w-[480px] lg:flex-shrink-0 lg:flex lg:flex-col lg:h-full lg:overflow-hidden lg:border-r lg:border-white/[0.06]">

            {/* Cover art hero — full bleed with gradient fade */}
            <div
              className="relative w-full overflow-hidden flex-shrink-0"
              style={{ height: "45dvh" }}
            >
              {song.coverArtUrl ? (
                <Image
                  key={song.coverArtUrl}
                  src={song.coverArtUrl}
                  alt={song.title}
                  fill
                  className={`object-cover animate-fade-in transition-transform duration-1000 ${
                    isActive ? "scale-[1.04]" : "scale-100"
                  }`}
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-surface-2 flex items-center justify-center">
                  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#D4820A" strokeWidth="1" opacity="0.2">
                    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
              )}

              {/* Top vignette — legibility for back button */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
              {/* Bottom fade — blends into the black player area */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-transparent to-black pointer-events-none" />

              {/* Back button + label — float over the image */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-5 pb-2">
                <Link
                  href="/"
                  aria-label="Back to Library"
                  className="w-11 h-11 flex items-center justify-center text-white/60 hover:text-white transition-colors -ml-1"
                >
                  <ChevronDownIcon />
                </Link>
                <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/40">
                  Now Playing
                </span>
                <ShareButton title={song.title} slug={song.slug} />
              </div>
            </div>

            {/* Track info */}
            <div className="px-6 pt-3 pb-1 animate-fade-up" style={{ animationDelay: "0.05s" }}>
              <h1 className="text-3xl font-bold text-white leading-tight tracking-tight">
                {song.title}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[11px] text-white/35 uppercase tracking-[0.3em]">KAI</span>
                {isActive && (
                  <>
                    <span className="text-white/15">·</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent/70">Playing</span>
                  </>
                )}
                {isLoading && isCurrentSong && (
                  <>
                    <span className="text-white/15">·</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/40">Loading…</span>
                  </>
                )}
                {noAudio && (
                  <>
                    <span className="text-white/15">·</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">Coming Soon</span>
                  </>
                )}
                {song.labels?.length > 0 && song.labels.map((label) => (
                  <span
                    key={label}
                    className={`text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${LABEL_STYLES[label]}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
              {song.tags?.length > 0 && (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {song.tags.map((tag) => (
                    <span key={tag} className="text-[11px] text-white/30 font-medium">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Progress bar */}
            {!noAudio && (
              <div className="px-6 pt-2 pb-0">
                <div
                  ref={scrubRef}
                  onPointerDown={onScrubPointerDown}
                  onPointerMove={onScrubPointerMove}
                  onPointerUp={onScrubPointerUp}
                  className="flex items-center py-3"
                  style={{ touchAction: "none", cursor: isCurrentSong ? "pointer" : "default" }}
                  role={isCurrentSong ? "slider" : undefined}
                  aria-label={isCurrentSong ? "Song progress" : undefined}
                  aria-valuenow={isCurrentSong ? Math.round(displayProgress * 100) : undefined}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="w-full h-1.5 rounded-full relative" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="absolute top-0 left-0 h-full bg-accent rounded-full" style={{ width: `${displayProgress * 100}%` }}>
                      <div className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg" style={{ right: 0, transform: "translate(50%, -50%)" }} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between -mt-1 text-[10px] text-white/25 tabular-nums font-mono">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(displayDuration)}</span>
                </div>
              </div>
            )}

            {/* Controls — shuffle | prev | play | next | repeat */}
            <div className="flex items-center justify-between px-6 py-4">
              <button
                onClick={toggleShuffle}
                aria-label={shuffle ? "Shuffle on" : "Shuffle off"}
                className={`w-11 h-11 flex items-center justify-center transition-all duration-200 active:scale-90 relative ${
                  shuffle ? "text-accent" : "text-white/30 hover:text-white/55"
                }`}
              >
                <ShuffleIcon />
                {shuffle && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />}
              </button>

              <button
                onClick={handlePrevious}
                aria-label="Previous track"
                disabled={!hasPrevious}
                className={`w-11 h-11 flex items-center justify-center transition-all duration-200 ${
                  hasPrevious ? "text-white/60 hover:text-white active:scale-90" : "text-white/15 cursor-default"
                }`}
              >
                <PreviousIcon />
              </button>

              <button
                onClick={noAudio ? undefined : handlePlayPause}
                aria-label={isActive ? `Pause ${song.title}` : `Play ${song.title}`}
                disabled={noAudio}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
                  noAudio
                    ? "bg-white/8 border border-white/10 cursor-not-allowed"
                    : "bg-accent hover:bg-accent-hover"
                }`}
                style={noAudio ? {} : { boxShadow: "0 0 40px rgba(212,130,10,0.4), 0 16px 40px rgba(0,0,0,0.5)" }}
              >
                {isLoading && isCurrentSong ? (
                  <LoadingSpinner />
                ) : isActive ? (
                  <PauseIcon size={26} />
                ) : (
                  <PlayIcon size={26} />
                )}
              </button>

              <button
                onClick={handleNext}
                aria-label="Next track"
                disabled={!hasNext && repeat === "off"}
                className={`w-11 h-11 flex items-center justify-center transition-all duration-200 ${
                  hasNext || repeat === "all" ? "text-white/60 hover:text-white active:scale-90" : "text-white/15 cursor-default"
                }`}
              >
                <NextIcon />
              </button>

              <button
                onClick={cycleRepeat}
                aria-label={`Repeat: ${repeat}`}
                className={`w-11 h-11 flex items-center justify-center transition-all duration-200 active:scale-90 relative ${
                  repeat !== "off" ? "text-accent" : "text-white/30 hover:text-white/55"
                }`}
              >
                {repeat === "one" ? <RepeatOneIcon /> : <RepeatIcon />}
                {repeat !== "off" && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />}
              </button>
            </div>

            {/* Mobile only: Lyrics / Kai Says — pill buttons open bottom sheet */}
            {(song.lyrics || song.explanation) && (
              <div className="flex gap-2 px-6 pb-20 lg:hidden">
                {song.lyrics && (
                  <button
                    onClick={() => setBottomSheet("lyrics")}
                    className="flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 hover:text-white/70 transition-colors"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    Lyrics
                  </button>
                )}
                {song.explanation && (
                  <button
                    onClick={() => setBottomSheet("kaisays")}
                    className="flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 hover:text-white/70 transition-colors"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    Kai Says
                  </button>
                )}
              </div>
            )}

          </div>

          {/* ══ RIGHT: Lyrics / Kai Says — desktop only ══ */}
          {(song.lyrics || song.explanation) && (
            <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:overflow-y-auto">

              {/* Tab bar */}
              <div className="flex-shrink-0 flex items-center gap-1 px-10 pt-10 pb-6 border-b border-white/[0.06]">
                {song.lyrics && (
                  <button
                    onClick={() => setDesktopTab("lyrics")}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-200 ${
                      desktopTab === "lyrics"
                        ? "bg-white/10 text-white"
                        : "text-white/30 hover:text-white/60"
                    }`}
                  >
                    Lyrics
                  </button>
                )}
                {song.explanation && (
                  <button
                    onClick={() => setDesktopTab("kaisays")}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-200 ${
                      desktopTab === "kaisays"
                        ? "bg-white/10 text-white"
                        : "text-white/30 hover:text-white/60"
                    }`}
                  >
                    Kai Says
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="px-10 py-8 pb-20">
                {desktopTab === "lyrics" && song.lyrics && (
                  <pre className="text-sm text-white/60 leading-loose font-sans whitespace-pre-wrap">
                    {song.lyrics}
                  </pre>
                )}
                {desktopTab === "kaisays" && song.explanation && (
                  <p className="text-sm text-white/60 leading-relaxed">{song.explanation}</p>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* ── Mobile bottom sheet: portalled to body to escape stacking context ── */}
      {bottomSheet && createPortal(
        <div className="fixed inset-0 z-[200] lg:hidden flex flex-col justify-end" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-backdrop"
            onClick={() => setBottomSheet(null)}
          />
          {/* Sheet — sits above the nav */}
          <div
            className="relative flex flex-col rounded-t-2xl overflow-hidden animate-slide-up"
            style={{ maxHeight: "80dvh", background: "#141414", borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-9 h-1 rounded-full bg-white/15" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b border-white/[0.06]">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                {bottomSheet === "lyrics" ? "Lyrics" : "Kai Says"}
              </span>
              <button
                onClick={() => setBottomSheet(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-white/30 hover:text-white/60 transition-colors text-sm"
                style={{ background: "rgba(255,255,255,0.06)" }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {/* Content — pb-16 clears the nav bar */}
            <div className="flex-1 overflow-y-auto px-5 py-6 pb-16">
              {bottomSheet === "lyrics" && song.lyrics && (
                <pre className="text-sm text-white/60 leading-loose font-sans whitespace-pre-wrap">
                  {song.lyrics}
                </pre>
              )}
              {bottomSheet === "kaisays" && song.explanation && (
                <p className="text-sm text-white/60 leading-relaxed">{song.explanation}</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-white/25 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function PreviousIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="19,20 9,12 19,4" />
      <rect x="5" y="4" width="2.5" height="16" rx="1" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,4 15,12 5,20" />
      <rect x="16.5" y="4" width="2.5" height="16" rx="1" />
    </svg>
  );
}

function PlayIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" className="ml-1">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function PauseIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function RepeatOneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      <text x="11.5" y="14" fontSize="6" fill="currentColor" stroke="none" textAnchor="middle" fontWeight="bold">1</text>
    </svg>
  );
}
