"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log to error tracking when wired up
    console.error(error);
  }, [error]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-muted/30 mb-4">Error</p>
      <h1 className="text-3xl font-bold text-text tracking-tight mb-2">Something went wrong</h1>
      <p className="text-sm text-muted/50 mb-8 max-w-xs">
        We couldn&apos;t load this page. It&apos;s not you — try again.
      </p>
      <div className="flex items-center gap-5">
        <button
          onClick={reset}
          className="text-xs font-bold uppercase tracking-[0.2em] text-accent hover:text-accent-hover transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-xs font-bold uppercase tracking-[0.2em] text-muted/40 hover:text-muted transition-colors"
        >
          ← Library
        </Link>
      </div>
    </div>
  );
}
