export type SongLabel = "new" | "trending" | "featured";
export type RepeatMode = "off" | "all" | "one";

export type Song = {
  id: string;
  slug: string;
  title: string;
  description: string;
  mp3Url: string;
  coverArtUrl: string;
  lyrics: string;
  explanation?: string;
  labels: SongLabel[];
  tags: string[];
  published: boolean;
  createdAt: string;
};
