import type { Candidate, RawLyrics } from "../types";
import type { LyricsProvider } from "./interface";
import { DEMO_SONGS } from "./demoCatalog";

// Note: This app currently ships with a mock provider for local development.
// Replace `getProvider()` with a real provider when you're ready.

interface MockSongMeta {
  id: string;
  title: string;
  artist: string;
  sections: { label: string; lineCount: number }[];
}

function s(
  id: string,
  title: string,
  artist: string,
  sections: MockSongMeta["sections"] = [
    { label: "Verse 1", lineCount: 4 },
    { label: "Chorus", lineCount: 4 },
    { label: "Verse 2", lineCount: 4 },
    { label: "Chorus", lineCount: 4 },
    { label: "Bridge", lineCount: 3 },
  ],
): MockSongMeta {
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

// Song catalog — only metadata, NO lyrics text in source.
// Lyrics are generated programmatically in getLyrics().
const SPECIAL_SECTIONS: Record<string, MockSongMeta["sections"]> = {
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

function catalogKey(title: string, artist: string): string {
  return `${normalizeQuery(title)}|${normalizeQuery(artist)}`;
}

const CATALOG: MockSongMeta[] = (() => {
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

function buildRawText(meta: MockSongMeta): string {
  return meta.sections
    .map((s) => {
      const header = `[${s.label}]`;
      const lines = Array.from(
        { length: s.lineCount },
        (_, i) => `${meta.title} - ${s.label} line ${i + 1}`,
      );
      return `${header}\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeQuery(s: string): string {
  return s
    .toLowerCase()
    .replace(/[()'".,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  return normalizeQuery(s)
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);
}

function allTokensPresent(needles: string[], haystack: string): boolean {
  if (needles.length === 0) return false;
  return needles.every((t) => haystack.includes(t));
}

function scoreSong(query: string, song: MockSongMeta): number {
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

export class MockProvider implements LyricsProvider {
  async searchSongs(query: string): Promise<Candidate[]> {
    await delay(300);
    const scored = CATALOG.map((song) => ({
      song,
      score: scoreSong(query, song),
    }))
      .filter((x) => x.score >= 0.18)
      .sort((a, b) => b.score - a.score)
      .slice(0, 80);

    return scored.map(({ song, score }) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      score,
    }));
  }

  async getLyrics(songId: string): Promise<RawLyrics> {
    await delay(200);
    const meta = CATALOG.find((s) => s.id === songId);
    if (!meta) throw new Error(`Song not found: ${songId}`);
    return {
      songId: meta.id,
      title: meta.title,
      artist: meta.artist,
      raw: buildRawText(meta),
    };
  }
}

export function getProvider(): LyricsProvider {
  return new MockProvider();
}
