import { NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/providers/mock";
import { normalizeLyrics } from "@/lib/lyrics/normalize";
import type { NormalizedSong } from "@/lib/types";

const schema = z.object({
  query: z.string().min(1).max(200),
});

function shouldAutoSelect(candidates: { score: number }[]): boolean {
  if (candidates.length === 1) return true;
  if (candidates.length === 0) return false;
  const top = candidates[0];
  const second = candidates[1];
  if (!top || !second) return true;
  return top.score >= 0.95 && top.score - second.score >= 0.2;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const provider = getProvider();
    const candidates = await provider.searchSongs(parsed.data.query);

    let topMatch: NormalizedSong | null = null;
    if (shouldAutoSelect(candidates)) {
      const raw = await provider.getLyrics(candidates[0].id);
      topMatch = normalizeLyrics(raw);
    }

    return NextResponse.json({ query: parsed.data.query, candidates, topMatch });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
