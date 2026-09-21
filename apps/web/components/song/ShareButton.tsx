"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SITE_URL } from "@beatsbykai/core";
import { trackSongShared } from "@/lib/analytics";

const COPIED_RESET_MS = 2000;

export default function ShareButton({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleShare = useCallback(async () => {
    // Canonical URL, not window.location — the share must never carry query params.
    const url = `${SITE_URL}/songs/${slug}`;

    // Deliberately no `text` field. Passing one makes iMessage fall back to plain
    // text instead of unfurling the Open Graph card, and the card already carries
    // the title and description.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        trackSongShared(title, slug, "native");
        return;
      } catch (err) {
        // The user dismissed the sheet — not a failure, and not a share.
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Anything else falls through to the clipboard path.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      trackSongShared(title, slug, "clipboard");
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      // Clipboard blocked (insecure context or denied permission). Nothing more
      // we can offer without hijacking the page, so fail quietly.
    }
  }, [title, slug]);

  return (
    <div className="relative flex items-center justify-end">
      {copied && (
        <span
          className="absolute right-full mr-2 whitespace-nowrap rounded-full bg-black/75 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white animate-fade-in"
          aria-hidden="true"
        >
          Link copied
        </span>
      )}
      <button
        type="button"
        onClick={handleShare}
        aria-label={`Share ${title}`}
        className="hero-icon w-11 h-11 flex items-center justify-center text-white/95 hover:text-white transition-colors -mr-1"
      >
        {copied ? <CheckIcon /> : <ShareIcon />}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
