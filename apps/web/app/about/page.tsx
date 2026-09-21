import type { Metadata } from "next";
import AboutAccordion from "./AboutAccordion";

export const metadata: Metadata = {
  title: "About",
  description:
    "A voice from Kuwait. Opinions, perspectives, and music from a region the world rarely lets speak for itself.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background px-5">
      <header className="pt-12 pb-8">
        <p className="text-xs text-muted uppercase tracking-widest mb-2">
          About
        </p>
        <h1 className="text-3xl font-bold text-text tracking-tight">Kai</h1>
      </header>
      <AboutAccordion />
    </div>
  );
}
