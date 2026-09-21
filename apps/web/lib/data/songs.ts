import { createSongsClient } from "@beatsbykai/core";

// Web binding for the shared Worker client. Next's fetch extensions are
// passed through `init` so @beatsbykai/core stays framework-free.
const client = createSongsClient({
  baseUrl: process.env.WORKER_URL,
  init: { next: { revalidate: 60 } } as RequestInit,
});

export const getPublishedSongs = client.getPublishedSongs;
export const getSongBySlug = client.getSongBySlug;
