"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { reorderSongsAction, togglePublishAction } from "@/lib/admin/actions";
import DeleteSongButton from "./DeleteSongButton";
import type { AdminSong } from "@/lib/admin/api";

export default function ReorderList({ initialSongs }: { initialSongs: AdminSong[] }) {
  const [songs, setSongs] = useState(initialSongs);
  const [isPending, startTransition] = useTransition();

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= songs.length) return;
    const next = [...songs];
    [next[index], next[target]] = [next[target], next[index]];
    setSongs(next);
    startTransition(async () => {
      await reorderSongsAction(next.map((s) => s.slug));
    });
  };

  return (
    <ul className="divide-y divide-cp-border">
      {songs.map((song, i) => (
        <li key={song.id} className="px-4 py-4 sm:px-5 hover:bg-cp-bg/50 transition-colors">
          {/* Top row: order controls + cover + info */}
          <div className="flex items-center gap-3 mb-3">
            {/* Up / Down */}
            <div className="flex flex-col gap-px flex-shrink-0">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0 || isPending}
                className="w-6 h-5 flex items-center justify-center text-[10px] text-cp-muted hover:text-cp-text disabled:opacity-20 disabled:cursor-default transition-colors"
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === songs.length - 1 || isPending}
                className="w-6 h-5 flex items-center justify-center text-[10px] text-cp-muted hover:text-cp-text disabled:opacity-20 disabled:cursor-default transition-colors"
                aria-label="Move down"
              >
                ▼
              </button>
            </div>

            {/* Cover */}
            <div className="w-10 h-10 rounded-lg bg-cp-bg flex-shrink-0 overflow-hidden border border-cp-border">
              {song.coverArtUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={song.coverArtUrl} alt={song.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cp-muted/30 text-xs">?</div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-cp-muted/35 tabular-nums flex-shrink-0">
                  #{String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm font-semibold text-cp-text truncate">{song.title}</p>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <StatusBadge published={song.published} />
                {song.mp3Url && <FileBadge label="MP3" />}
                {song.coverArtUrl && <FileBadge label="Cover" />}
                {song.labels?.map((l) => <LabelBadge key={l} label={l} />)}
              </div>
            </div>
          </div>

          {/* Bottom row: actions */}
          <div className="flex items-center gap-2">
            <Link href={`/controlpanel/songs/${song.slug}`} className="flex-1 text-center cp-btn-outline text-[11px] py-2">
              Edit
            </Link>
            <form className="flex-1" action={togglePublishAction.bind(null, song.slug, !song.published)}>
              <button type="submit" className="w-full cp-btn-ghost text-[11px] py-2">
                {song.published ? "Unpublish" : "Publish"}
              </button>
            </form>
            <DeleteSongButton slug={song.slug} title={song.title} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
      published ? "bg-emerald-500/15 text-emerald-400" : "bg-cp-border text-cp-muted"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${published ? "bg-emerald-400" : "bg-cp-muted"}`} />
      {published ? "Published" : "Draft"}
    </span>
  );
}

function FileBadge({ label }: { label: string }) {
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cp-accent/10 text-cp-accent">
      {label}
    </span>
  );
}

const LABEL_COLORS: Record<string, string> = {
  featured: "bg-violet-500/15 text-violet-400",
  new:      "bg-emerald-500/15 text-emerald-400",
  trending: "bg-amber-500/15 text-amber-400",
};

function LabelBadge({ label }: { label: string }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${LABEL_COLORS[label] ?? "bg-cp-border text-cp-muted"}`}>
      {label}
    </span>
  );
}
