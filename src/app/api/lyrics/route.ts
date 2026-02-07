import { NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/providers/mock";
import { normalizeLyrics } from "@/lib/lyrics/normalize";

const schema = z.object({
  songId: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const provider = getProvider();
    const raw = await provider.getLyrics(parsed.data.songId);
    const song = { ...normalizeLyrics(raw), source: "demo" as const };

    return NextResponse.json({ songId: parsed.data.songId, song });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lyrics lookup failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
