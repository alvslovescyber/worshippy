import type { Candidate, RawLyrics } from "../types";
import type { LyricsProvider } from "./interface";

// Note: This app currently ships with a mock provider for local development.
// Replace `getProvider()` with a real provider when you're ready.

interface MockSongMeta {
  id: string;
  title: string;
  artist: string;
  sections: { label: string; lineCount: number }[];
}

// Song catalog — only metadata, NO lyrics text in source.
// Lyrics are generated programmatically in getLyrics().
const CATALOG: MockSongMeta[] = [
  {
    id: "ff-001",
    title: "Firm Foundation",
    artist: "Cody Carnes",
    sections: [
      { label: "Verse 1", lineCount: 4 },
      { label: "Chorus", lineCount: 4 },
      { label: "Verse 2", lineCount: 4 },
      { label: "Chorus", lineCount: 4 },
      { label: "Bridge", lineCount: 3 },
    ],
  },
  {
    id: "tr-002",
    title: "Tremble",
    artist: "Mosaic MSC",
    sections: [
      { label: "Verse 1", lineCount: 4 },
      { label: "Pre-Chorus", lineCount: 2 },
      { label: "Chorus", lineCount: 4 },
      { label: "Verse 2", lineCount: 4 },
      { label: "Bridge", lineCount: 3 },
    ],
  },
  {
    id: "gg-003",
    title: "Goodness of God",
    artist: "Bethel Music",
    sections: [
      { label: "Verse 1", lineCount: 4 },
      { label: "Chorus", lineCount: 4 },
      { label: "Verse 2", lineCount: 4 },
      { label: "Chorus", lineCount: 4 },
      { label: "Bridge", lineCount: 2 },
    ],
  },
  {
    id: "bm-004",
    title: "Build My Life",
    artist: "Housefires",
    sections: [
      { label: "Verse 1", lineCount: 4 },
      { label: "Verse 2", lineCount: 4 },
      { label: "Chorus", lineCount: 4 },
      { label: "Bridge", lineCount: 3 },
    ],
  },
  {
    id: "ga-005",
    title: "Great Are You Lord",
    artist: "All Sons and Daughters",
    sections: [
      { label: "Verse 1", lineCount: 3 },
      { label: "Chorus", lineCount: 4 },
      { label: "Verse 2", lineCount: 3 },
      { label: "Chorus", lineCount: 4 },
      { label: "Bridge", lineCount: 2 },
    ],
  },
];

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

export class MockProvider implements LyricsProvider {
  async searchSongs(query: string): Promise<Candidate[]> {
    await delay(300);
    const q = query.toLowerCase();
    return CATALOG.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q),
    )
      .map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        score: s.title.toLowerCase() === q ? 1 : 0.7,
      }))
      .sort((a, b) => b.score - a.score);
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
