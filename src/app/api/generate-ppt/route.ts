import { NextResponse } from "next/server";
import { z } from "zod";
import { splitIntoSlides } from "@/lib/lyrics/split";
import { buildPptx } from "@/lib/pptx/builder";
import type { NormalizedSong, GenerateSettings } from "@/lib/types";

const schema = z.object({
  songs: z.array(
    z.object({
      title: z.string(),
      artist: z.string().optional(),
      sections: z.array(
        z.object({ label: z.string(), lines: z.array(z.string()) }),
      ),
    }),
  ),
  settings: z.object({
    linesPerSlide: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    showSectionLabels: z.boolean(),
    theme: z.enum(["dark", "light"]),
    backgroundImage: z.string().optional(),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { songs, settings } = parsed.data as {
      songs: NormalizedSong[];
      settings: GenerateSettings;
    };

    const slides = splitIntoSlides(songs, settings);
    const buffer = await buildPptx(slides, settings);
    const fileBody = new Uint8Array(buffer);

    return new NextResponse(fileBody, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": 'attachment; filename="worship-set.pptx"',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
