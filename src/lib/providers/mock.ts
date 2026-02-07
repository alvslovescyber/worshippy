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

// Song catalog — only metadata, NO lyrics text in source.
// Lyrics are generated programmatically in getLyrics().
const CATALOG: MockSongMeta[] = [
  s("ff-001", "Firm Foundation", "Cody Carnes"),
  s("tr-002", "Tremble", "Mosaic MSC", [
    { label: "Verse 1", lineCount: 4 },
    { label: "Pre-Chorus", lineCount: 2 },
    { label: "Chorus", lineCount: 4 },
    { label: "Verse 2", lineCount: 4 },
    { label: "Bridge", lineCount: 3 },
  ]),
  s("gg-003", "Goodness of God", "Bethel Music", [
    { label: "Verse 1", lineCount: 4 },
    { label: "Chorus", lineCount: 4 },
    { label: "Verse 2", lineCount: 4 },
    { label: "Chorus", lineCount: 4 },
    { label: "Bridge", lineCount: 2 },
  ]),
  s("bm-004", "Build My Life", "Housefires", [
    { label: "Verse 1", lineCount: 4 },
    { label: "Verse 2", lineCount: 4 },
    { label: "Chorus", lineCount: 4 },
    { label: "Bridge", lineCount: 3 },
  ]),
  s("ga-005", "Great Are You Lord", "All Sons and Daughters", [
    { label: "Verse 1", lineCount: 3 },
    { label: "Chorus", lineCount: 4 },
    { label: "Verse 2", lineCount: 3 },
    { label: "Chorus", lineCount: 4 },
    { label: "Bridge", lineCount: 2 },
  ]),

  // Expanded demo catalog (metadata only; lyrics are placeholders).
  s("wi-006", "Worthy Is The Name", "Elevation Worship"),
  s("og-007", "Oceans (Where Feet May Fail)", "Hillsong UNITED"),
  s("wh-008", "What a Beautiful Name", "Hillsong Worship"),
  s("wg-009", "Way Maker", "Sinach"),
  s("hg-010", "How Great Is Our God", "Chris Tomlin"),
  s("hs-011", "How He Loves", "John Mark McMillan"),
  s("am-012", "Amazing Grace (My Chains Are Gone)", "Chris Tomlin"),
  s("10-013", "10,000 Reasons (Bless the Lord)", "Matt Redman"),
  s("cn-014", "Cornerstone", "Hillsong Worship"),
  s("ks-015", "King of Kings", "Hillsong Worship"),
  s("lw-016", "Living Hope", "Phil Wickham"),
  s("rt-017", "Reckless Love", "Cory Asbury"),
  s("gh-018", "Graves Into Gardens", "Elevation Worship"),
  s("bc-019", "Battle Belongs", "Phil Wickham"),
  s("bg-020", "Blessed Be Your Name", "Matt Redman"),
  s("fv-021", "Forever", "Kari Jobe"),
  s("hb-022", "Holy Spirit", "Bryan & Katie Torwalt"),
  s("go-023", "Good Good Father", "Chris Tomlin"),
  s("sh-024", "Same God", "Elevation Worship"),
  s("tw-025", "The Way", "Pat Barrett"),
  s("nw-026", "No Longer Slaves", "Bethel Music"),
  s("sp-027", "Spirit Break Out", "Kim Walker-Smith"),
  s("cm-028", "Christ Is Enough", "Hillsong Worship"),
  s("ps-029", "Praise", "Elevation Worship"),
  s("is-030", "Is He Worthy", "Andrew Peterson"),
  s("ot-031", "O Come to the Altar", "Elevation Worship"),
  s("lp-032", "Lion and the Lamb", "Bethel Music"),
  s("db-033", "Do It Again", "Elevation Worship"),
  s("wl-034", "Who You Say I Am", "Hillsong Worship"),
  s("ns-035", "New Wine", "Hillsong Worship"),
  s("tg-036", "This Is Amazing Grace", "Phil Wickham"),
  s("hs-037", "Here Again", "Elevation Worship"),
  s("sl-038", "So Will I (100 Billion X)", "Hillsong UNITED"),
  s("gy-039", "Great You Are", "All Sons & Daughters"),
  s("rn-040", "Raise a Hallelujah", "Bethel Music"),
  s("wy-041", "Yes I Will", "Vertical Worship"),
  s("gd-042", "God of Revival", "Bethel Music"),
  s("lw-043", "Lord I Need You", "Matt Maher"),
  s("hp-044", "He Will Hold Me Fast", "Ada Ruth Habershon"),
  s("nb-045", "Nothing Else", "Cody Carnes"),
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

function normalizeQuery(s: string): string {
  return s
    .toLowerCase()
    .replace(/[()'".,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreSong(query: string, song: MockSongMeta): number {
  const q = normalizeQuery(query);
  if (!q) return 0;

  const title = normalizeQuery(song.title);
  const artist = normalizeQuery(song.artist);
  const hay = `${title} ${artist}`.trim();

  if (q === title) return 1;
  if (q === hay) return 1;
  if (title.startsWith(q)) return 0.92;
  if (hay.startsWith(q)) return 0.9;
  if (title.includes(q)) return 0.78;
  if (artist.includes(q)) return 0.72;
  if (hay.includes(q)) return 0.7;

  const tokens = q.split(" ").filter(Boolean);
  if (tokens.length === 0) return 0;
  const hit = tokens.filter((t) => hay.includes(t)).length;
  return (hit / tokens.length) * 0.65;
}

export class MockProvider implements LyricsProvider {
  async searchSongs(query: string): Promise<Candidate[]> {
    await delay(300);
    const scored = CATALOG.map((song) => ({
      song,
      score: scoreSong(query, song),
    }))
      .filter((x) => x.score >= 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

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
