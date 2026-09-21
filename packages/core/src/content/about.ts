// About copy, as data rather than JSX, so web and mobile render the same
// words through their own primitives. Edit here, not in either app.

export type AboutSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export const ABOUT_SECTIONS: AboutSection[] = [
  {
    id: "who",
    title: "Who is Kai",
    paragraphs: [
      "Kai is a music project rooted in Kuwait. The music is AI-produced. The lyrics are written and shaped by a human. Someone who grew up in the Middle East, who lives inside the perspective being expressed, and who chose this format to say things that don’t always find another outlet.",
      "Kai doesn’t claim to voice fact. He’s a voice for those who can’t share theirs. Opinions, perspectives, and lived experience from a region the world has spent decades interpreting from the outside.",
    ],
  },
  {
    id: "point",
    title: "The Point",
    paragraphs: [
      "Our cultures differ. Our lives align more than most people know. That’s the tension Kai sits in. Not to argue a side, but to show the interior. The parts that don’t make the news. The grief, the pride, the frustration, the ordinary.",
      "Kai has no label. No career to protect. No publicist managing the fallout. The only constraint is honesty.",
    ],
  },
  {
    id: "format",
    title: "Why This Format",
    paragraphs: [
      "Rap carries weight differently than other forms. It can hold contradiction, anger, nuance, and beauty in the same breath. AI production removes the gatekeepers. No studio, no label, no one deciding what’s too much.",
      "The result is something that sounds like music and functions like a perspective. Take it or leave it, but it’s honest.",
    ],
  },
  {
    id: "influences",
    title: "Influences",
    paragraphs: [
      "Kai is heavily influenced by the work of Lupe Fiasco. The density of thought, the layered references, the refusal to make it easy. Lupe proved that rap could carry real intellectual weight without losing its edge.",
      "In honor of that, Kai drops small easter eggs across his work. Nods to the catalog, the concepts, the patterns. They’re there for those paying attention.",
    ],
  },
];
