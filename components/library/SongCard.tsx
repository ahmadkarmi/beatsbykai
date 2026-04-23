"use client";

import Image from "next/image";
import Link from "next/link";
import { usePlayer } from "@/components/player/PlayerContext";
import { Song, SongLabel } from "@/lib/types";

const LABEL_STYLES: Record<SongLabel, string> = {
  new:      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  trending: "bg-amber-500/15  text-amber-400  border border-amber-500/20",
  featured: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
};

export default function SongCard({ song, index }: { song: Song; index?: number }) {
  const { currentSong, isPlaying, play, pause, resume } = usePlayer();
  const isActive = currentSong?.id === song.id;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isActive) {
      isPlaying ? pause() : resume();
    } else {
      play(song, "song_list");
    }
  };

  return (
    <Link
      href={`/songs/${song.slug}`}
      className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.05] group active:bg-white/[0.02] transition-colors"
    >
      {/* Cover art */}
      <div
        className={`w-[4.75rem] h-[4.75rem] flex-shrink-0 overflow-hidden transition-all duration-300 ${
          isActive ? "ring-1 ring-accent/60 ring-offset-2 ring-offset-background" : ""
        }`}
      >
        {song.coverArtUrl ? (
          <Image
            src={song.coverArtUrl}
            alt={song.title}
            width={76}
            height={76}
            className="w-full h-full object-cover"
          />
        ) : (
          <Placeholder index={index ?? 0} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isActive && (
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 bg-accent ${
                isPlaying ? "animate-pulse" : "opacity-60"
              }`}
            />
          )}
          <p
            className={`text-[15px] font-bold leading-tight truncate transition-colors duration-200 ${
              isActive ? "text-accent" : "text-text"
            }`}
          >
            {song.title}
          </p>
        </div>
        {song.labels?.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {song.labels.map((label) => (
              <span
                key={label}
                className={`text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${LABEL_STYLES[label]}`}
              >
                {label}
              </span>
            ))}
          </div>
        )}
        <p className="text-[13px] text-muted/60 mt-1.5 leading-snug line-clamp-2">
          {song.description}
        </p>
      </div>

      {/* Play / pause */}
      <button
        onClick={handlePlayPause}
        aria-label={isActive && isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
          isActive
            ? "bg-accent text-white"
            : "bg-transparent text-muted/30 group-hover:text-muted/70"
        }`}
      >
        {isActive && isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
    </Link>
  );
}

function Placeholder({ index }: { index: number }) {
  return (
    <div className="w-full h-full bg-surface flex items-center justify-center">
      <span className="text-3xl font-bold text-muted/10 tabular-nums select-none">
        {String(index).padStart(2, "0")}
      </span>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}
