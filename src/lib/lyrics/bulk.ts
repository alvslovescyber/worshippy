export interface BulkLyricsBlock {
  title: string;
  lyrics: string;
}

export interface BulkLyricsParseResult {
  blocks: BulkLyricsBlock[];
}

export interface BulkLyricsMatch {
  entryId: string;
  title: string;
  lyrics: string;
}

export function normalizeTitleKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[()'".,]/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMarkerTitle(line: string, known: Set<string>): string | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const hash = trimmed.match(/^#{1,6}\s+(.+)$/);
  if (hash?.[1]) return hash[1].trim();

  const bracket = trimmed.match(/^\[(song|title)\]\s*(.+)$/i);
  if (bracket?.[2]) return bracket[2].trim();

  const eq = trimmed.match(/^=+\s*(.+?)\s*=+$/);
  if (eq?.[1]) return eq[1].trim();

  const k = normalizeTitleKey(trimmed);
  if (known.has(k)) return trimmed;

  return null;
}

export function parseBulkLyrics(
  input: string,
  knownTitles: string[],
): BulkLyricsParseResult {
  const known = new Set(knownTitles.map(normalizeTitleKey));
  const lines = input.replace(/\r\n/g, "\n").split("\n");

  const blocks: BulkLyricsBlock[] = [];
  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (!currentTitle) return;
    const lyrics = currentLines.join("\n").trim();
    if (!lyrics) return;
    blocks.push({ title: currentTitle, lyrics });
  };

  for (const line of lines) {
    const marker = extractMarkerTitle(line, known);
    if (marker) {
      flush();
      currentTitle = marker;
      currentLines = [];
      continue;
    }

    if (!currentTitle) continue;
    currentLines.push(line);
  }

  flush();

  return { blocks };
}

export function matchBulkLyrics(
  blocks: BulkLyricsBlock[],
  titleKeyToEntryId: Record<string, string>,
): { matches: BulkLyricsMatch[]; unmatched: BulkLyricsBlock[] } {
  const matches: BulkLyricsMatch[] = [];
  const unmatched: BulkLyricsBlock[] = [];

  for (const b of blocks) {
    const key = normalizeTitleKey(b.title);
    const entryId = titleKeyToEntryId[key];
    if (!entryId) {
      unmatched.push(b);
      continue;
    }
    matches.push({ entryId, title: b.title, lyrics: b.lyrics });
  }

  return { matches, unmatched };
}
