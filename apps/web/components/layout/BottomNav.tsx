"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlayer } from "@/components/player/PlayerContext";

const navItems = [
  {
    href: "/",
    label: "Library",
    icon: LibraryIcon,
  },
  {
    href: "/about",
    label: "About",
    icon: AboutIcon,
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { currentSong, isPlaying } = usePlayer();

  // Show only when a song with actual audio is loaded (playing or paused)
  const hasActiveSong = currentSong !== null && !!currentSong.mp3Url;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-14 backdrop-blur-2xl bg-glass border-t border-white/5 z-40 flex"
      aria-label="Primary navigation"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/"
            ? pathname === "/" || pathname.startsWith("/songs")
            : pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
              isActive ? "text-accent" : "text-muted/60 hover:text-text"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-accent rounded-full animate-fade-in" />
            )}
            <Icon active={isActive} />
            <span className="text-[9px] font-bold uppercase tracking-[0.12em]">
              {label}
            </span>
          </Link>
        );
      })}

      {/* Now Playing tab — slides in when audio is loaded */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out flex-shrink-0"
        style={{ width: hasActiveSong ? "30%" : "0%", opacity: hasActiveSong ? 1 : 0 }}
        aria-hidden={!hasActiveSong}
      >
        <Link
          href={currentSong ? `/songs/${currentSong.slug}` : "/"}
          className="h-14 w-full flex flex-col items-center justify-center gap-0.5 text-accent"
          tabIndex={hasActiveSong ? undefined : -1}
        >
          <NowPlayingBarsIcon isPlaying={isPlaying} />
          <span className="text-[9px] font-bold uppercase tracking-[0.12em]">Playing</span>
        </Link>
      </div>
    </nav>
  );
}

function NowPlayingBarsIcon({ isPlaying }: { isPlaying: boolean }) {
  const bars = [
    { delay: "0s",    pauseHeight: "35%" },
    { delay: "0.18s", pauseHeight: "70%" },
    { delay: "0.36s", pauseHeight: "50%" },
  ];

  return (
    <div className="flex items-end gap-[3px]" style={{ height: 18, width: 18 }}>
      {bars.map((bar, i) => (
        <div
          key={i}
          className="flex-1 rounded-full bg-accent"
          style={{
            height: "100%",
            transformOrigin: "bottom",
            transform: isPlaying ? undefined : `scaleY(${bar.pauseHeight})`,
            animation: isPlaying
              ? `eq-bar 0.75s ease-in-out infinite ${bar.delay}`
              : "none",
          }}
        />
      ))}
    </div>
  );
}

function LibraryIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function AboutIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
