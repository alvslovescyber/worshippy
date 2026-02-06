import type { RawLyrics, NormalizedSong, SongSection } from "@/lib/types";

const KNOWN_LABELS: Record<string, SongSection["label"]> = {
  "verse 1": "Verse 1",
  "verse 2": "Verse 2",
  "verse 3": "Verse 3",
  "verse 4": "Verse 4",
  chorus: "Chorus",
  "pre-chorus": "Pre-Chorus",
  bridge: "Bridge",
  tag: "Tag",
  outro: "Outro",
  intro: "Intro",
};

const SECTION_RE = /^\[([^\]]+)\]$/;

function resolveLabel(raw: string): SongSection["label"] {
  return KNOWN_LABELS[raw.trim().toLowerCase()] ?? "Other";
}

function cleanLines(lines: string[]): string[] {
  const trimmed = lines.map((l) => l.trim());
  const out: string[] = [];
  let prevBlank = false;
  for (const line of trimmed) {
    if (line === "") {
      if (!prevBlank) out.push(line);
      prevBlank = true;
    } else {
      out.push(line);
      prevBlank = false;
    }
  }
  while (out.length > 0 && out[0] === "") out.shift();
  while (out.length > 0 && out[out.length - 1] === "") out.pop();
  return out;
}

export function normalizeLyrics(raw: RawLyrics): NormalizedSong {
  const rawLines = raw.raw.split(/\r?\n/);
  const hasHeaders = rawLines.some((l) => SECTION_RE.test(l.trim()));

  if (!hasHeaders) {
    const cleaned = cleanLines(rawLines);
    return {
      title: raw.title,
      artist: raw.artist,
      sections: cleaned.length > 0 ? [{ label: "Verse 1", lines: cleaned }] : [],
    };
  }

  const sections: SongSection[] = [];
  let label: SongSection["label"] | null = null;
  let buf: string[] = [];

  for (const rawLine of rawLines) {
    const match = rawLine.trim().match(SECTION_RE);
    if (match) {
      if (label !== null) {
        const cleaned = cleanLines(buf);
        if (cleaned.length > 0) sections.push({ label, lines: cleaned });
      }
      label = resolveLabel(match[1]);
      buf = [];
    } else if (label !== null) {
      buf.push(rawLine);
    }
  }

  if (label !== null) {
    const cleaned = cleanLines(buf);
    if (cleaned.length > 0) sections.push({ label, lines: cleaned });
  }

  return { title: raw.title, artist: raw.artist, sections };
}
