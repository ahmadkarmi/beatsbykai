"use client";

import { PlayerProvider } from "@/components/player/PlayerContext";
import BottomNav from "@/components/layout/BottomNav";
import MainContent from "@/components/layout/MainContent";
import MiniPlayer from "@/components/player/MiniPlayer";
import NavigationProgress from "@/components/layout/NavigationProgress";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <NavigationProgress />
      <div className="flex flex-col min-h-screen">
        <MainContent>{children}</MainContent>
        <MiniPlayer />
        <BottomNav />
      </div>
    </PlayerProvider>
  );
}
