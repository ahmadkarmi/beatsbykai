import Link from "next/link";
import { adminListSongs } from "@/lib/admin/api";
import { logoutAction } from "@/lib/admin/actions";
import ReorderList from "./_components/ReorderList";

export const dynamic = "force-dynamic";

export default async function ControlPanelPage() {
  let songs: Awaited<ReturnType<typeof adminListSongs>> = [];
  try {
    songs = await adminListSongs();
  } catch {
    // Worker not reachable — show empty state
  }

  const published = songs.filter((s) => s.published).length;
  const drafts = songs.length - published;

  return (
    <div className="min-h-screen bg-cp-bg">
      {/* Top Bar */}
      <header className="bg-cp-surface border-b border-cp-border px-6 py-4 flex items-center justify-between">
        <Link
          href="/controlpanel/songs/new"
          className="bg-cp-accent hover:bg-cp-accent-hover text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <span className="text-base leading-none">+</span> New Track
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="text-xs text-cp-muted hover:text-cp-text transition-colors px-3 py-2 rounded-lg hover:bg-cp-border">
            Sign Out
          </button>
        </form>
      </header>

      <main className="px-4 py-6 sm:px-6 sm:py-8 max-w-6xl mx-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Tracks", value: songs.length },
            { label: "Published", value: published, highlight: true },
            { label: "Drafts", value: drafts },
          ].map((stat) => (
            <div key={stat.label} className="bg-cp-surface border border-cp-border rounded-xl px-3 py-3 sm:px-5 sm:py-4">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-cp-muted">{stat.label}</p>
              <p className={`text-2xl sm:text-3xl font-bold mt-1 ${stat.highlight ? "text-cp-accent" : "text-cp-text"}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Track List */}
        <div className="bg-cp-surface border border-cp-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-cp-border">
            <h2 className="text-sm font-semibold text-cp-text">Tracks</h2>
          </div>

          {songs.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 rounded-full bg-cp-border flex items-center justify-center mx-auto mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cp-muted">
                  <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-cp-muted">No tracks yet</p>
              <Link href="/controlpanel/songs/new" className="text-cp-accent text-sm mt-2 inline-block hover:underline">
                Add your first track →
              </Link>
            </div>
          ) : (
            <ReorderList initialSongs={songs} />
          )}
        </div>

        <p className="text-[11px] text-cp-muted/30 text-center mt-8">
          Changes are live within 60 seconds via ISR
        </p>
      </main>
    </div>
  );
}

