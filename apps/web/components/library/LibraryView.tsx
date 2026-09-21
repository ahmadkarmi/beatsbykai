"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/components/player/PlayerContext";
import { Song } from "@beatsbykai/core";
import { LABEL_STYLES } from "@/lib/labels";

export default function LibraryView({ songs }: { songs: Song[] }) {
  const { setQueue, isPlaying } = usePlayer();

  useEffect(() => {
    setQueue(songs);
  }, [songs, setQueue]);

  if (songs.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-xs text-muted/30 uppercase tracking-widest">No tracks yet.</p>
      </div>
    );
  }

  // First song with the "featured" label; fall back to first in playlist order
  const featured = songs.find((s) => s.labels?.includes("featured")) ?? songs[0];
  const rest = songs.filter((s) => s.id !== featured.id);

  return (
    <>
      {/* ── Mobile layout ── */}
      <div className="lg:hidden min-h-screen bg-background pb-28">
        <MobileHero song={featured} songs={songs} />

        {/* Popular header + track list */}
        <div className="px-5 pt-2 pb-1 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <p className="text-lg font-bold text-text">Popular</p>
        </div>
        <div>
          {songs.map((song, i) => (
            <div
              key={song.id}
              className="animate-fade-up"
              style={{ animationDelay: `${0.12 + i * 0.04}s` }}
            >
              <MobileTrackRow song={song} index={i + 1} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Desktop editorial layout ── */}
      <div className="hidden lg:flex min-h-screen bg-background">

        {/* Left: sticky featured panel */}
        <div className="sticky top-0 h-screen w-[420px] xl:w-[480px] flex-shrink-0 flex flex-col border-r border-white/[0.06]">
          {/* Header */}
          <div className="px-8 pt-10 pb-5 flex items-end justify-between flex-shrink-0">
            <div>
              <p className="text-[8px] font-mono text-accent/50 uppercase tracking-[0.4em] mb-2 flex items-center gap-1.5">
                <span className={`w-1 h-1 rounded-full bg-accent/60 inline-block ${isPlaying ? "animate-pulse" : "opacity-30"}`} />
                Broadcasting
              </p>
              <h1 className="text-5xl font-bold text-text tracking-[-0.05em] leading-none">KAI</h1>
            </div>
            <div className="text-right pb-1 space-y-0.5">
              <p className="text-[8px] font-mono text-muted/35 uppercase tracking-[0.22em]">{songs.length}&thinsp;Tracks</p>
              <p className="text-[8px] font-mono text-muted/20 uppercase tracking-[0.22em]">Kuwait</p>
            </div>
          </div>

          {/* Featured cover fills remaining height */}
          <div className="flex-1 min-h-0 pb-14">
            <DesktopFeaturedCard song={featured} />
          </div>
        </div>

        {/* Right: scrollable track list */}
        <div className="flex-1 overflow-y-auto pb-14">
          <div className="px-10 pt-10 pb-4 border-b border-white/[0.04]">
            <p className="text-[9px] font-mono text-muted/30 uppercase tracking-[0.35em]">All Tracks</p>
          </div>

          <div>
            {songs.map((song, i) => (
              <div
                key={song.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <DesktopTrackRow song={song} index={i + 1} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Desktop: left panel featured card ─────────────────────── */
function DesktopFeaturedCard({ song }: { song: Song }) {
  const { currentSong, isPlaying, play, pause, resume } = usePlayer();
  const router = useRouter();
  const isActive = currentSong?.id === song.id;
  const noAudio = !song.mp3Url;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isActive) {
      isPlaying ? pause() : resume();
    } else {
      play(song, "library_featured");
      router.push(`/songs/${song.slug}`);
    }
  };

  return (
    <div className="relative h-full overflow-hidden group">
      {song.coverArtUrl ? (
        <Image
          src={song.coverArtUrl}
          alt={song.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          priority
          sizes="480px"
        />
      ) : (
        <div className="absolute inset-0 bg-surface-2" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/50" />

      <div className="absolute top-5 left-5">
        <span className={`text-[8px] font-bold uppercase tracking-[0.35em] px-2.5 py-1.5 border ${
          noAudio ? "text-white/30 border-white/15" : "text-accent border-accent/40"
        }`}>
          {noAudio ? "Coming Soon" : "Latest Drop"}
        </span>
      </div>

      {isActive && (
        <div className="absolute top-5 right-5 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full bg-accent ${isPlaying ? "animate-pulse" : "opacity-40"}`} />
          <span className="text-[8px] font-bold uppercase tracking-[0.22em] text-accent/80">
            {isPlaying ? "Playing" : "Paused"}
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-6">
        <Link href={`/songs/${song.slug}`} className="block mb-5">
          <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">{song.title}</h2>
          {song.description && (
            <p className="text-xs text-white/40 mt-2 leading-relaxed line-clamp-2">{song.description}</p>
          )}
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePlayPause}
            disabled={noAudio}
            className={`flex items-center gap-2.5 font-bold text-[10px] uppercase tracking-[0.25em] px-5 h-10 transition-all duration-200 ${
              noAudio ? "bg-white/4 text-white/20 cursor-not-allowed border border-white/8"
              : isActive && isPlaying ? "bg-accent text-white"
              : "bg-white/8 text-white/65 border border-white/12 hover:bg-white/14"
            }`}
          >
            {!noAudio && (isActive && isPlaying ? <PauseIconSvg size={11} /> : <PlayIconSvg size={11} />)}
            {noAudio ? "Coming Soon" : isActive && isPlaying ? "Pause" : "Listen Now"}
          </button>
          <Link
            href={`/songs/${song.slug}`}
            className="h-10 w-10 flex items-center justify-center border border-white/12 text-white/35 hover:text-white/65 hover:border-white/25 transition-all text-base"
          >
            ↗
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Desktop: right panel track row ────────────────────────── */
function DesktopTrackRow({ song, index }: { song: Song; index: number }) {
  const { currentSong, isPlaying, play, pause, resume } = usePlayer();
  const router = useRouter();
  const isActive = currentSong?.id === song.id;
  const noAudio = !song.mp3Url;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (noAudio) return;
    if (isActive) {
      isPlaying ? pause() : resume();
    } else {
      play(song, "library_grid");
      router.push(`/songs/${song.slug}`);
    }
  };

  return (
    <div
      className={`group flex items-center gap-5 px-10 py-4 border-b border-white/[0.04] border-l-2 cursor-pointer transition-all duration-150 hover:bg-white/[0.025] ${
        isActive ? "bg-accent/[0.06] border-l-accent" : "border-l-transparent hover:border-l-white/10"
      }`}
      onClick={() => router.push(`/songs/${song.slug}`)}
    >
      {/* Track number */}
      <span className="w-7 text-right text-[11px] font-mono tabular-nums flex-shrink-0 text-muted/25">
        {String(index).padStart(2, "0")}
      </span>

      {/* Thumbnail */}
      <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden rounded-sm bg-surface-2">
        {song.coverArtUrl ? (
          <Image src={song.coverArtUrl} alt={song.title} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted/20 text-xs font-mono">{String(index).padStart(2, "0")}</span>
          </div>
        )}
        {isActive && <div className="absolute inset-0 ring-1 ring-inset ring-accent/50" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate transition-colors ${isActive ? "text-accent" : "text-text"}`}>
          {song.title}
        </p>
        {song.description && (
          <p className="text-xs text-muted/45 truncate mt-0.5">{song.description}</p>
        )}
        {song.labels?.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {song.labels.map((label) => (
              <span
                key={label}
                className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${LABEL_STYLES[label]}`}
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Play/pause button — visible on hover or when active */}
      {!noAudio && (
        <button
          onClick={handlePlayPause}
          aria-label={isActive && isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            isActive
              ? "bg-accent opacity-100"
              : "bg-white/10 border border-white/10 opacity-0 group-hover:opacity-100"
          }`}
        >
          {isActive && isPlaying ? <PauseIconSvg size={10} /> : <PlayIconSvg size={10} />}
        </button>
      )}
      {noAudio && <div className="w-9 flex-shrink-0" />}
    </div>
  );
}

/* ─── Mobile: hero ───────────────────────────────────────────── */
function MobileHero({ song, songs }: { song: Song; songs: Song[] }) {
  const { currentSong, isPlaying, play, pause, resume } = usePlayer();
  const router = useRouter();
  const isActive = !!currentSong;

  const handlePlay = () => {
    if (isActive) {
      isPlaying ? pause() : resume();
    } else {
      play(songs[0], "library_featured");
      router.push(`/songs/${songs[0].slug}`);
    }
  };

  return (
    <div>
      {/* Full-bleed hero image */}
      <div className="relative w-full" style={{ aspectRatio: "1/1" }}>
        <Image
          src="/BeatsByKaiProfile.jpg"
          alt="Kai"
          fill
          className="object-cover object-top"
          priority
          sizes="100vw"
        />
        {/* Gradient fade to background at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        {/* Logo + wordmark */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
          <img src="/KaiLogoWhite.png" alt="Kai" className="h-12 w-auto object-contain" />
          <p className="text-[10px] font-mono text-white/40 tracking-[0.3em] uppercase mt-1">beatsbykai</p>
        </div>
      </div>

      {/* Metadata + play button */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="space-y-0.5">
          <p className="text-[11px] text-muted/50 font-mono uppercase tracking-[0.25em]">Kuwait</p>
          <p className="text-[11px] text-muted/30 font-mono uppercase tracking-[0.25em]">{songs.length} Tracks</p>
        </div>
        <button
          onClick={handlePlay}
          aria-label={isActive && isPlaying ? "Pause" : "Play all"}
          className="w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30 transition-transform active:scale-95"
        >
          {isActive && isPlaying ? <PauseIconSvg size={18} /> : <PlayIconSvg size={18} />}
        </button>
      </div>
    </div>
  );
}

/* ─── Mobile: playlist row ───────────────────────────────────── */
function MobileTrackRow({ song, index }: { song: Song; index: number }) {
  const { currentSong, isPlaying, play, pause, resume } = usePlayer();
  const router = useRouter();
  const isActive = currentSong?.id === song.id;
  const noAudio = !song.mp3Url;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (noAudio) return;
    if (isActive) {
      isPlaying ? pause() : resume();
    } else {
      play(song, "library_grid");
      router.push(`/songs/${song.slug}`);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 transition-colors duration-150 border-l-2 active:bg-white/[0.03] ${
        isActive ? "bg-accent/[0.06] border-accent" : "border-transparent hover:bg-white/[0.025] hover:border-white/10"
      }`}
      onClick={() => router.push(`/songs/${song.slug}`)}
    >
      <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden rounded-sm bg-surface-2">
        {song.coverArtUrl ? (
          <Image src={song.coverArtUrl} alt={song.title} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted/20 text-xs font-mono">{String(index).padStart(2, "0")}</span>
          </div>
        )}
        {isActive && <div className="absolute inset-0 ring-1 ring-inset ring-accent/50" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isActive ? "text-accent" : "text-text"}`}>
          {song.title}
        </p>
        {song.description && (
          <p className="text-xs text-muted/45 truncate mt-0.5">{song.description}</p>
        )}
        {song.labels?.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {song.labels.map((label) => (
              <span key={label} className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${LABEL_STYLES[label]}`}>
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {!noAudio && (
        <button
          onClick={handlePlayPause}
          aria-label={isActive && isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            isActive ? "bg-accent" : "bg-white/8 border border-white/10"
          }`}
        >
          {isActive && isPlaying ? <PauseIconSvg size={10} /> : <PlayIconSvg size={10} />}
        </button>
      )}
      {noAudio && <div className="w-10 flex-shrink-0" />}
    </div>
  );
}

function PlayIconSvg({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function PauseIconSvg({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}
