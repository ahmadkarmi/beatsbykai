"use client";

import { useState } from "react";

const sections = [
  {
    id: "who",
    title: "Who is Kai",
    content: (
      <>
        <p className="text-sm text-text leading-relaxed">
          Kai is a music project rooted in Kuwait. The music is AI-produced.
          The lyrics are written and shaped by a human. Someone who grew up
          in the Middle East, who lives inside the perspective being expressed,
          and who chose this format to say things that don&apos;t always find
          another outlet.
        </p>
        <p className="text-sm text-text leading-relaxed mt-3">
          Kai doesn&apos;t claim to voice fact. He&apos;s a voice for those
          who can&apos;t share theirs. Opinions, perspectives, and lived
          experience from a region the world has spent decades interpreting
          from the outside.
        </p>
      </>
    ),
  },
  {
    id: "point",
    title: "The Point",
    content: (
      <>
        <p className="text-sm text-text leading-relaxed">
          Our cultures differ. Our lives align more than most people know.
          That&apos;s the tension Kai sits in. Not to argue a side, but to
          show the interior. The parts that don&apos;t make the news. The
          grief, the pride, the frustration, the ordinary.
        </p>
        <p className="text-sm text-text leading-relaxed mt-3">
          Kai has no label. No career to protect. No publicist managing the
          fallout. The only constraint is honesty.
        </p>
      </>
    ),
  },
  {
    id: "format",
    title: "Why This Format",
    content: (
      <>
        <p className="text-sm text-text leading-relaxed">
          Rap carries weight differently than other forms. It can hold
          contradiction, anger, nuance, and beauty in the same breath. AI
          production removes the gatekeepers. No studio, no label, no one
          deciding what&apos;s too much.
        </p>
        <p className="text-sm text-text leading-relaxed mt-3">
          The result is something that sounds like music and functions like a
          perspective. Take it or leave it, but it&apos;s honest.
        </p>
      </>
    ),
  },
  {
    id: "influences",
    title: "Influences",
    content: (
      <>
        <p className="text-sm text-text leading-relaxed">
          Kai is heavily influenced by the work of Lupe Fiasco. The density
          of thought, the layered references, the refusal to make it easy.
          Lupe proved that rap could carry real intellectual weight without
          losing its edge.
        </p>
        <p className="text-sm text-text leading-relaxed mt-3">
          In honor of that, Kai drops small easter eggs across his work.
          Nods to the catalog, the concepts, the patterns. They&apos;re
          there for those paying attention.
        </p>
      </>
    ),
  },
];

export default function AboutAccordion() {
  const [open, setOpen] = useState<string>("who");

  return (
    <div className="pb-12 max-w-prose divide-y divide-border">
      {sections.map((section, i) => {
        const isOpen = open === section.id;
        return (
          <div
            key={section.id}
            className="animate-fade-up"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <button
              onClick={() => setOpen(isOpen ? "" : section.id)}
              className="w-full flex items-center justify-between py-4 text-left group"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-accent transition-opacity group-hover:opacity-80">
                {section.title}
              </span>
              <span
                className="text-muted text-sm ml-4 shrink-0 transition-transform duration-300"
                style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
              >
                +
              </span>
            </button>
            {/* Smooth height via grid trick */}
            <div
              className="grid transition-all duration-300 ease-in-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div className="pb-5">{section.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
