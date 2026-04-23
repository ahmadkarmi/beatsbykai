import Link from "next/link";
import SongForm from "@/app/controlpanel/_components/SongForm";
import { createSongAction } from "@/lib/admin/actions";

export const maxDuration = 60;

export default function NewSongPage() {
  return (
    <div className="min-h-screen bg-cp-bg">
      <header className="bg-cp-surface border-b border-cp-border px-6 py-4 flex items-center gap-4">
        <Link href="/controlpanel" className="text-cp-muted hover:text-cp-text transition-colors text-sm flex items-center gap-1.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5m7-7-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Dashboard
        </Link>
        <span className="text-cp-border">·</span>
        <h1 className="text-sm font-semibold text-cp-text">New Track</h1>
      </header>
      <main className="px-6 py-8 max-w-3xl mx-auto">
        <SongForm action={createSongAction} submitLabel="Create Track" />
      </main>
    </div>
  );
}
