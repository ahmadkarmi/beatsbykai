"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/components/player/PlayerContext";
import type { Song, SongLabel } from "@/lib/types";

// Mirrors the library's row treatment. LibraryView still defines its own rows
// inline; it can adopt this once there is a reason to touch that file.
const LABEL_STYLES: Record<SongLabel, string> = {
  new: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  trending: "bg-amber-500/15  text-amber-400  border border-amber-500/25",
  featured: "bg-violet-500/15 text-violet-400 border border-violet-500/25",
};

export default function SongRow({
  song,
  index,
  queue,
}: {
  song: Song;
  index: number;
  queue: Song[];
}) {
  const router = useRouter();
  const { currentSong, isPlaying, play, pause, resume, setQueue } = usePlayer();

  const isActive = currentSong?.id === song.id;
  const noAudio = !song.mp3Url;

  const open = () => router.push(`/songs/${song.slug}`);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (noAudio) return;
    if (isActive) {
      if (isPlaying) pause();
      else resume();
      return;
    }
    // Play in the context of this tag, so next/prev stay on-theme.
    setQueue(queue);
    play(song, "song_list");
    open();
  };

  return (
    <div
      onClick={open}
      className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors duration-150 border-l-2 active:bg-white/[0.03] ${
        isActive
          ? "bg-accent/[0.06] border-accent"
          : "border-transparent hover:bg-white/[0.025] hover:border-white/10"
      }`}
    >
      <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden rounded-sm bg-surface-2">
        {song.coverArtUrl ? (
          <Image src={song.coverArtUrl} alt="" fill className="object-cover" sizes="48px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted/20 text-xs font-mono">
              {String(index).padStart(2, "0")}
            </span>
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

      <button
        onClick={handlePlayPause}
        disabled={noAudio}
        aria-label={isActive && isPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
        className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${
          noAudio
            ? "text-white/15 cursor-default"
            : "text-white/60 hover:text-white hover:bg-white/5 active:scale-95"
        }`}
      >
        {isActive && isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>
    </div>
  );
}
