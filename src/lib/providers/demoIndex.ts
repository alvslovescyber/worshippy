import type { Candidate, RawLyrics } from "../types";
import { DEMO_SONGS } from "./demoCatalog";

interface DemoSongMeta {
  id: string;
  title: string;
  artist: string;
  sections: { label: string; lineCount: number }[];
}

function s(
  id: string,
  title: string,
  artist: string,
  sections: DemoSongMeta["sections"] = [
    { label: "Verse 1", lineCount: 4 },
    { label: "Chorus", lineCount: 4 },
    { label: "Verse 2", lineCount: 4 },
    { label: "Chorus", lineCount: 4 },
    { label: "Bridge", lineCount: 3 },
  ],
): DemoSongMeta {
  return { id, title, artist, sections };
}

function slugifyIdPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[()'".,]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 28);
}

function buildSongId(title: string, artist: string, index: number): string {
  const t = slugifyIdPart(title) || "song";
  const a = slugifyIdPart(artist) || "artist";
  const suffix = String(index + 1).padStart(4, "0");
  return `${t}-${a}-${suffix}`;
}

function normalizeQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/[()'".,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeQuery(value)
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);
}

function allTokensPresent(needles: string[], haystack: string): boolean {
  if (needles.length === 0) return false;
  return needles.every((t) => haystack.includes(t));
}

function scoreSong(query: string, song: DemoSongMeta): number {
  const q = normalizeQuery(query);
  if (!q) return 0;

  const title = normalizeQuery(song.title);
  const artist = normalizeQuery(song.artist);
  const hay = `${title} ${artist}`.trim();
  const tokens = tokenize(q);

  if (q === title) return 1;
  if (q === hay) return 1;
  if (title.startsWith(q)) return 0.92;
  if (hay.startsWith(q)) return 0.9;
  if (title.includes(q)) return 0.78;
  if (artist.includes(q)) return 0.72;
  if (hay.includes(q)) return 0.7;

  if (tokens.length === 0) return 0;
  if (allTokensPresent(tokens, title)) return 0.84;
  if (allTokensPresent(tokens, hay)) return 0.76;

  const hit = tokens.filter((t) => hay.includes(t)).length;
  return (hit / tokens.length) * 0.62;
}

function catalogKey(title: string, artist: string): string {
  return `${normalizeQuery(title)}|${normalizeQuery(artist)}`;
}

const SPECIAL_SECTIONS: Record<string, DemoSongMeta["sections"]> = {
  "tremble|mosaic msc": [
    { label: "Verse 1", lineCount: 4 },
    { label: "Pre-Chorus", lineCount: 2 },
    { label: "Chorus", lineCount: 4 },
    { label: "Verse 2", lineCount: 4 },
    { label: "Bridge", lineCount: 3 },
  ],
  "goodness of god|bethel music": [
    { label: "Verse 1", lineCount: 4 },
    { label: "Chorus", lineCount: 4 },
    { label: "Verse 2", lineCount: 4 },
    { label: "Chorus", lineCount: 4 },
    { label: "Bridge", lineCount: 2 },
  ],
  "build my life|housefires": [
    { label: "Verse 1", lineCount: 4 },
    { label: "Verse 2", lineCount: 4 },
    { label: "Chorus", lineCount: 4 },
    { label: "Bridge", lineCount: 3 },
  ],
  "great are you lord|all sons and daughters": [
    { label: "Verse 1", lineCount: 3 },
    { label: "Chorus", lineCount: 4 },
    { label: "Verse 2", lineCount: 3 },
    { label: "Chorus", lineCount: 4 },
    { label: "Bridge", lineCount: 2 },
  ],
};

export const DEMO_CATALOG: DemoSongMeta[] = (() => {
  const seen = new Set<string>();
  const unique = DEMO_SONGS.filter((e) => {
    const key = catalogKey(e.title, e.artist);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.map((entry, index) => {
    const key = catalogKey(entry.title, entry.artist);
    const sections = SPECIAL_SECTIONS[key];
    return s(
      buildSongId(entry.title, entry.artist, index),
      entry.title,
      entry.artist,
      sections,
    );
  });
})();

export function searchDemoCatalog(
  query: string,
  opts?: { minScore?: number; limit?: number },
): Candidate[] {
  const minScore = opts?.minScore ?? 0.18;
  const limit = opts?.limit ?? 80;

  const scored = DEMO_CATALOG.map((song) => ({
    song,
    score: scoreSong(query, song),
  }))
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ song, score }) => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    score,
  }));
}

export function getDemoMeta(songId: string): DemoSongMeta | undefined {
  return DEMO_CATALOG.find((s) => s.id === songId);
}

function buildRawText(meta: DemoSongMeta): string {
  return meta.sections
    .map((section) => {
      const header = `[${section.label}]`;
      const lines = Array.from(
        { length: section.lineCount },
        (_, i) => `${meta.title} - ${section.label} line ${i + 1}`,
      );
      return `${header}\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

export function getDemoLyrics(songId: string): RawLyrics {
  const meta = getDemoMeta(songId);
  if (!meta) throw new Error(`Song not found: ${songId}`);
  return {
    songId: meta.id,
    title: meta.title,
    artist: meta.artist,
    raw: buildRawText(meta),
  };
}
