"use client";

import { createPortal } from "react-dom";
import { Song } from "@beatsbykai/core";

/** UI-side name. The analytics taxonomy calls "kaisays" an "explanation". */
export type SongSection = "lyrics" | "kaisays";

export function sectionLabel(section: SongSection): string {
  return section === "lyrics" ? "Lyrics" : "Kai Says";
}

/** Maps the UI section name onto the analytics `section` parameter. */
export function sectionEventName(section: SongSection): "lyrics" | "explanation" {
  return section === "kaisays" ? "explanation" : "lyrics";
}

/** Body of a section. Shared by the mobile sheet and the desktop panel. */
export function SectionBody({ section, song }: { section: SongSection; song: Song }) {
  if (section === "lyrics") {
    if (!song.lyrics) return null;
    return (
      <pre className="text-sm text-white/60 leading-loose font-sans whitespace-pre-wrap">
        {song.lyrics}
      </pre>
    );
  }
  if (!song.explanation) return null;
  return <p className="text-sm text-white/60 leading-relaxed">{song.explanation}</p>;
}

/**
 * Mobile bottom sheet. Portalled to <body> so it escapes the song page's
 * stacking context and can sit above the nav.
 */
export default function LyricsSheet({
  section,
  song,
  onClose,
}: {
  section: SongSection;
  song: Song;
  onClose: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[200] lg:hidden flex flex-col justify-end" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-backdrop"
        onClick={onClose}
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
            {sectionLabel(section)}
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white/30 hover:text-white/60 transition-colors text-sm"
            style={{ background: "rgba(255,255,255,0.06)" }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {/* Content — pb-16 clears the nav bar */}
        <div className="flex-1 overflow-y-auto px-5 py-6 pb-16">
          <SectionBody section={section} song={song} />
        </div>
      </div>
    </div>,
    document.body
  );
}
