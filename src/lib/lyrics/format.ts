import type { SongSectionLabel } from "@/lib/types";

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
  if (kind === "chorus") return "Chorus";
  if (kind === "pre-chorus") return "Pre-Chorus";
  if (kind === "bridge") return "Bridge";
  if (kind === "tag") return "Tag";
  if (kind === "outro") return "Outro";
  if (kind === "intro") return "Intro";
  return "Other";
}

function isMetadataLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  if (lower.startsWith("ccli song #")) return true;
  if (lower.startsWith("ccli license #")) return true;
  if (lower.startsWith("song #")) return true;
  if (lower.startsWith("license #")) return true;
  if (lower.startsWith("©") || lower.startsWith("(c)")) return true;
  if (lower.includes("all rights reserved")) return true;
  if (lower.includes("www.") || lower.includes("http://") || lower.includes("https://")) return true;
  if (lower.startsWith("capo")) return true;
  if (lower.startsWith("key:")) return true;
  if (lower.startsWith("tempo:")) return true;
  if (lower.startsWith("time:")) return true;
  return false;
}

function looksLikeChordsOnly(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  if (/[a-z]/.test(t)) return false;
  const tokens = t
    .replace(/[|()[\],]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return false;

  const chordToken =
    /^[A-G](?:#|b)?(?:m|maj|min|sus|dim|aug|add)?\d*(?:\/[A-G](?:#|b)?)?$/;
  const matches = tokens.filter((tok) => chordToken.test(tok)).length;

  return matches / tokens.length >= 0.8 && tokens.length >= 2;
}

function cleanLines(raw: string): string[] {
  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trimEnd());

  const out: string[] = [];
  let prevBlank = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (isMetadataLine(trimmed)) continue;
    if (looksLikeChordsOnly(trimmed)) continue;

    if (trimmed === "") {
      if (!prevBlank) out.push("");
      prevBlank = true;
    } else {
      out.push(trimmed);
      prevBlank = false;
    }
  }

  while (out.length > 0 && out[0] === "") out.shift();
  while (out.length > 0 && out[out.length - 1] === "") out.pop();
  return out;
}

function splitByBlankLines(lines: string[]): string[][] {
  const groups: string[][] = [];
  let buf: string[] = [];
  for (const line of lines) {
    if (!line.trim()) {
      if (buf.length > 0) groups.push(buf);
      buf = [];
      continue;
    }
    buf.push(line);
  }
  if (buf.length > 0) groups.push(buf);
  return groups;
}

export function autoFormatLyricsForEditor(raw: string): string {
  const lines = cleanLines(raw);
  const hasHeaders = lines.some((l) => parseHeaderLabel(l) !== null);

  if (!hasHeaders) {
    const stanzas = splitByBlankLines(lines);
    return stanzas
      .map((stanza, idx) => `[${toVerseLabel(idx + 1)}]\n${stanza.join("\n")}`)
      .join("\n\n");
  }

  const sections: { label: SongSectionLabel; lines: string[] }[] = [];
  let label: SongSectionLabel | null = null;
  let buf: string[] = [];

  for (const line of lines) {
    const parsed = parseHeaderLabel(line);
    if (parsed) {
      if (label && buf.length > 0) sections.push({ label, lines: buf });
      label = parsed;
      buf = [];
      continue;
    }
    if (!label) label = toVerseLabel(1);
    buf.push(line);
  }
  if (label && buf.length > 0) sections.push({ label, lines: buf });

  return sections
    .map((s) => `[${s.label}]\n${s.lines.join("\n")}`)
    .join("\n\n");
}

