/**
 * The Worker returns `createdAt` as "2026-04-12 15:20:08" — a space separator
 * and no timezone. That is not ISO 8601, so schema.org consumers can reject it
 * and `new Date()` parsing of it is implementation-defined rather than
 * specified. Normalise before it reaches structured data or a sitemap.
 */

const NAIVE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/;

/** Parses the Worker's format (treated as UTC) and real ISO 8601. */
export function parseSongDate(value: string | undefined | null): Date | null {
  if (!value) return null;

  const naive = NAIVE.exec(value.trim());
  const iso = naive ? `${naive[1]}-${naive[2]}-${naive[3]}T${naive[4]}:${naive[5]}:${naive[6]}Z` : value;

  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** ISO 8601 for schema.org `datePublished`, or undefined if unparseable. */
export function toIsoDate(value: string | undefined | null): string | undefined {
  return parseSongDate(value)?.toISOString();
}
