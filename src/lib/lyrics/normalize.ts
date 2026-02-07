import type {
  RawLyrics,
  NormalizedSong,
  SongSection,
  SongSectionLabel,
} from "@/lib/types";

const KNOWN_LABELS: Record<string, SongSectionLabel> = {
  chorus: "Chorus",
  "pre-chorus": "Pre-Chorus",
  "pre chorus": "Pre-Chorus",
  bridge: "Bridge",
  tag: "Tag",
  outro: "Outro",
  intro: "Intro",
};

const BRACKET_RE = /^\[([^\]]+)\]\s*$/;
const HEADER_RE =
  /^(verse|chorus|pre[- ]?chorus|bridge|tag|outro|intro)(?:\s+(\d+))?\s*:?\s*$/i;

function toVerseLabel(n: number): SongSectionLabel {
  return `Verse ${n}`;
}

function parseHeaderLabel(line: string): SongSectionLabel | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const bracket = trimmed.match(BRACKET_RE);
  const candidate = (bracket?.[1] ?? trimmed).trim();
  const match = candidate.match(HEADER_RE);
  if (!match) return null;

  const kindRaw = match[1]?.toLowerCase() ?? "";
  const kind = kindRaw.replace(/\s+/g, "-");
  const num = match[2] ? Number(match[2]) : null;

  if (kind === "verse") return toVerseLabel(num && num > 0 ? num : 1);
  return KNOWN_LABELS[kindRaw] ?? KNOWN_LABELS[kind] ?? "Other";
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
  const hasHeaders = rawLines.some((l) => parseHeaderLabel(l) !== null);

  if (!hasHeaders) {
    const cleaned = cleanLines(rawLines);
    return {
      title: raw.title,
      artist: raw.artist,
      sections: cleaned.length > 0 ? [{ label: toVerseLabel(1), lines: cleaned }] : [],
    };
  }

  const sections: SongSection[] = [];
  let label: SongSectionLabel | null = null;
  let buf: string[] = [];
  const prelude: string[] = [];

  for (const rawLine of rawLines) {
    const parsedLabel = parseHeaderLabel(rawLine);
    if (parsedLabel) {
      if (label !== null) {
        const cleaned = cleanLines(buf);
        if (cleaned.length > 0) sections.push({ label, lines: cleaned });
      }
      label = parsedLabel;
      buf = [];
      continue;
    }

    if (label === null) prelude.push(rawLine);
    else buf.push(rawLine);
  }

  if (label !== null && prelude.length > 0) {
    const cleanedPrelude = cleanLines(prelude);
    if (cleanedPrelude.length > 0) {
      sections.unshift({ label: toVerseLabel(1), lines: cleanedPrelude });
    }
  }

  if (label !== null) {
    const cleaned = cleanLines(buf);
    if (cleaned.length > 0) sections.push({ label, lines: cleaned });
  }

  return { title: raw.title, artist: raw.artist, sections };
}
