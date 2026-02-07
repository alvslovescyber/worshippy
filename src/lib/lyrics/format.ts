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

function normalizeForMatch(line: string): string {
  return line
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findRepeatedStanzaIndex(stanzas: string[][]): string | null {
  const counts = new Map<string, number>();
  for (const stanza of stanzas) {
    const key = stanza.map(normalizeForMatch).filter(Boolean).join("\n");
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best: { key: string; count: number } | null = null;
  for (const [key, count] of counts.entries()) {
    if (count < 2) continue;
    if (!best || count > best.count || (count === best.count && key.length > best.key.length)) {
      best = { key, count };
    }
  }
  return best?.key ?? null;
}

function inferChorusSequence(lines: string[]): { start: number; len: number }[] {
  const norm = lines.map(normalizeForMatch);
  const n = norm.length;
  if (n < 8) return [];

  type Seq = { len: number; starts: number[] };
  const candidates = new Map<string, Seq>();

  for (let len = 6; len >= 2; len--) {
    for (let i = 0; i + len <= n; i++) {
      const slice = norm.slice(i, i + len);
      if (slice.some((s) => !s)) continue;
      const key = slice.join("|");
      const existing = candidates.get(key);
      if (existing) existing.starts.push(i);
      else candidates.set(key, { len, starts: [i] });
    }
  }

  let best: { key: string; len: number; starts: number[]; score: number } | null = null;
  for (const [key, seq] of candidates.entries()) {
    if (seq.starts.length < 2) continue;
    // Prefer longer sequences that repeat more often.
    const score = seq.len * seq.starts.length;
    if (!best || score > best.score || (score === best.score && seq.len > best.len)) {
      best = { key, len: seq.len, starts: seq.starts, score };
    }
  }

  if (!best) return [];

  const starts = [...best.starts].sort((a, b) => a - b);
  const dedup: number[] = [];
  for (const s of starts) {
    const last = dedup[dedup.length - 1];
    if (last === undefined || s - last >= best.len) dedup.push(s);
  }

  return dedup.map((start) => ({ start, len: best.len }));
}

export function autoFormatLyricsForEditor(raw: string): string {
  const lines = cleanLines(raw);
  const hasHeaders = lines.some((l) => parseHeaderLabel(l) !== null);

  if (!hasHeaders) {
    const stanzas = splitByBlankLines(lines);
    if (stanzas.length > 1) {
      const chorusKey = findRepeatedStanzaIndex(stanzas);
      const isChorus = (stanza: string[]) =>
        chorusKey !== null &&
        stanza.map(normalizeForMatch).filter(Boolean).join("\n") === chorusKey;

      const chorusCount = stanzas.filter(isChorus).length;
      const lastChorusIdx = chorusKey
        ? stanzas.map((s, i) => (isChorus(s) ? i : -1)).filter((i) => i >= 0).pop() ?? -1
        : -1;

      let verseNum = 1;
      const formatted = stanzas.map((stanza, idx) => {
        if (isChorus(stanza)) return `[Chorus]\n${stanza.join("\n")}`;
        if (chorusCount >= 2 && idx > lastChorusIdx) return `[Bridge]\n${stanza.join("\n")}`;
        return `[${toVerseLabel(verseNum++)}]\n${stanza.join("\n")}`;
      });
      return formatted.join("\n\n");
    }

    const one = stanzas[0] ?? [];
    const chorusSpans = inferChorusSequence(one);
    if (chorusSpans.length === 0) {
      return `[${toVerseLabel(1)}]\n${one.join("\n")}`;
    }

    const out: { label: SongSectionLabel; lines: string[] }[] = [];
    let verseNum = 1;
    let i = 0;

    for (const span of chorusSpans) {
      if (span.start > i) {
        const chunk = one.slice(i, span.start).filter((l) => l.trim() !== "");
        if (chunk.length > 0) out.push({ label: toVerseLabel(verseNum++), lines: chunk });
      }
      const chorusLines = one.slice(span.start, span.start + span.len);
      out.push({ label: "Chorus", lines: chorusLines });
      i = span.start + span.len;
    }

    const tail = one.slice(i).filter((l) => l.trim() !== "");
    if (tail.length > 0) out.push({ label: toVerseLabel(verseNum), lines: tail });

    return out.map((s) => `[${s.label}]\n${s.lines.join("\n")}`).join("\n\n");
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
