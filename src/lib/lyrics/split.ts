import type { NormalizedSong, GenerateSettings, SlideContent } from "@/lib/types";

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function chunkLines(lines: string[], max: number): string[][] {
  if (lines.length <= max) return [lines];

  const chunks: string[][] = [];
  for (let i = 0; i < lines.length; i += max) chunks.push(lines.slice(i, i + max));

  if (max >= 3 && chunks.length >= 2) {
    const last = chunks[chunks.length - 1]!;
    const prev = chunks[chunks.length - 2]!;
    if (last.length === 1 && prev.length > 2) {
      last.unshift(prev.pop()!);
    }
  }

  return chunks.filter((c) => c.length > 0);
}

function splitByBlankLines(lines: string[]): string[][] {
  const groups: string[][] = [];
  let buf: string[] = [];
  for (const line of lines) {
    if (line.trim() === "") {
      if (buf.length > 0) groups.push(buf);
      buf = [];
      continue;
    }
    buf.push(line);
  }
  if (buf.length > 0) groups.push(buf);
  return groups;
}

export function splitIntoSlides(
  songs: NormalizedSong[],
  settings: GenerateSettings,
): SlideContent[] {
  const slides: SlideContent[] = [];

  slides.push({ type: "cover", title: "Worship Set", date: formatDate() });

  for (const song of songs) {
    slides.push({ type: "title", title: song.title, artist: song.artist });

    for (const section of song.sections) {
      const cleaned = section.lines.map((l) => l.trim());
      const groups = splitByBlankLines(cleaned);

      for (const group of groups) {
        const chunks = chunkLines(group, settings.linesPerSlide);
        for (const chunk of chunks) {
          const slide: SlideContent = { type: "lyrics", lines: chunk };
          if (settings.showSectionLabels) slide.sectionLabel = section.label;
          slides.push(slide);
        }
      }
    }
  }

  return slides;
}
