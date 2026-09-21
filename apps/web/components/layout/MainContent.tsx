"use client";

import { usePlayer } from "@/components/player/PlayerContext";
import PageTransition from "./PageTransition";

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentSong } = usePlayer();

  // pb-14 = 56px BottomNav; additional pb-16 = 64px MiniPlayer when active
  return (
    <main className={`flex-1 ${currentSong ? "pb-[7.5rem]" : "pb-14"}`}>
      <PageTransition>{children}</PageTransition>
    </main>
  );
}
