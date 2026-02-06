import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  input: z.string().min(1, "Input must not be empty"),
});

const MAX = 20;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const raw = parsed.data.input
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const seen = new Set<string>();
    const titles: string[] = [];
    for (const t of raw) {
      const key = t.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        titles.push(t);
      }
    }

    if (titles.length > MAX) {
      return NextResponse.json(
        { error: `Max ${MAX} songs per batch (you sent ${titles.length}).` },
        { status: 400 },
      );
    }

    return NextResponse.json({ titles });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
