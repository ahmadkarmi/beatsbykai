"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { usePlayer } from "@/components/player/PlayerContext";
import { trackMiniPlayerTap } from "@/lib/analytics";
import { LABEL_STYLES } from "@/lib/labels";

export default function MiniPlayer() {
  const { currentSong, isPlaying, progress, pause, resume } = usePlayer();
  const router = useRouter();
  const pathname = usePathname();

  // Hide when there's no song or we're already on the song page
  if (!currentSong || pathname.startsWith("/songs/")) return null;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    isPlaying ? pause() : resume();
  };

  return (
    <div
      className="fixed left-0 right-0 z-30 cursor-pointer backdrop-blur-2xl bg-glass border-t border-white/5 animate-slide-up"
      style={{ bottom: "3.5rem" }}
      onClick={() => {
        trackMiniPlayerTap(currentSong.title, currentSong.slug);
        router.push(`/songs/${currentSong.slug}`);
      }}
      role="button"
      aria-label={`Now playing: ${currentSong.title}. Tap to open player.`}
    >
      {/* Progress bar */}
      <div className="h-px bg-white/5">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-sm bg-surface-2 flex-shrink-0 overflow-hidden">
          {currentSong.coverArtUrl ? (
            <Image src={currentSong.coverArtUrl} alt={currentSong.title} width={40} height={40} className="w-full h-full object-cover" />
          ) : (
            <PlaceholderCover />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text truncate leading-tight">{currentSong.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {currentSong.labels?.map((label) => (
              <span
                key={label}
                className={`text-[8px] font-bold uppercase tracking-[0.15em] px-1.5 py-0.5 rounded-full ${LABEL_STYLES[label]}`}
              >
                {label}
              </span>
            ))}
            {(!currentSong.labels || currentSong.labels.length === 0) && (
              <p className="text-[10px] text-muted/70 uppercase tracking-wider">
                {isPlaying ? "Now Playing" : "Paused"}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handlePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0 hover:bg-accent-hover transition-colors"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    </div>
  );
}

function PlaceholderCover() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-surface-2 to-border flex items-center justify-center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4820A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" className="ml-0.5">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}
