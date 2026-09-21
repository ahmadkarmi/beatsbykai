"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/components/player/PlayerContext";
import { Song } from "@beatsbykai/core";
import { trackSongPageView, trackSectionToggled } from "@/lib/analytics";
import { tagSlug } from "@beatsbykai/core";
import ShareButton from "@/components/song/ShareButton";
import LyricsSheet, {
  SectionBody,
  sectionEventName,
  type SongSection,
} from "@/components/song/SongSections";
import {
  ChevronDownIcon,
  LoadingSpinner,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
} from "@/components/song/icons";
import { LABEL_STYLES } from "@/lib/labels";

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
  const [desktopTab, setDesktopTab] = useState<SongSection>(
    song.lyrics ? "lyrics" : "kaisays"
  );
  const [bottomSheet, setBottomSheet] = useState<SongSection | null>(null);

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

  const openSheet = (section: SongSection) => {
    setBottomSheet(section);
    trackSectionToggled(sectionEventName(section), "open", song.title, song.slug);
  };

  const closeSheet = () => {
    if (bottomSheet) {
      trackSectionToggled(sectionEventName(bottomSheet), "close", song.title, song.slug);
    }
    setBottomSheet(null);
  };

  const selectTab = (tab: SongSection) => {
    if (tab === desktopTab) return;
    setDesktopTab(tab);
    trackSectionToggled(sectionEventName(tab), "open", song.title, song.slug);
  };

  const handlePlayPause = () => {
    if (isCurrentSong) {
      if (isPlaying) pause();
      else resume();
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

              {/* Top vignette — legibility for the header controls */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/75 via-black/25 to-transparent pointer-events-none" />
              {/* Bottom fade — blends into the black player area */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-transparent to-black pointer-events-none" />

              {/* Back button + label — float over the image */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-5 pb-2">
                <Link
                  href="/"
                  aria-label="Back to Library"
                  className="hero-icon w-11 h-11 flex items-center justify-center text-white/95 hover:text-white transition-colors -ml-1"
                >
                  <ChevronDownIcon />
                </Link>
                <span className="hero-icon text-[9px] font-bold uppercase tracking-[0.35em] text-white/60">
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
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {song.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tags/${tagSlug(tag)}`}
                      className="text-[11px] font-medium text-white/45 hover:text-accent border border-white/[0.08] hover:border-accent/40 rounded-full px-2 py-0.5 transition-colors"
                    >
                      {tag}
                    </Link>
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
                    onClick={() => openSheet("lyrics")}
                    className="flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 hover:text-white/70 transition-colors"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    Lyrics
                  </button>
                )}
                {song.explanation && (
                  <button
                    onClick={() => openSheet("kaisays")}
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
                    onClick={() => selectTab("lyrics")}
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
                    onClick={() => selectTab("kaisays")}
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
                <SectionBody section={desktopTab} song={song} />
              </div>

            </div>
          )}

        </div>
      </div>

      {bottomSheet && (
        <LyricsSheet section={bottomSheet} song={song} onClose={closeSheet} />
      )}

    </div>
  );
}
