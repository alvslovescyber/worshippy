import type { NormalizedSong, GenerateSettings, SlideContent } from "@/lib/types";

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function chunkLines(lines: string[], max: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < lines.length; i += max) {
    chunks.push(lines.slice(i, i + max));
  }
  return chunks;
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
      // Filter out blank lines for slide content
      const nonBlank = section.lines.filter((l) => l.trim() !== "");
      const chunks = chunkLines(nonBlank, settings.linesPerSlide);

      for (const chunk of chunks) {
        const slide: SlideContent = { type: "lyrics", lines: chunk };
        if (settings.showSectionLabels) {
          slide.sectionLabel = section.label;
        }
        slides.push(slide);
      }
    }
  }

  return slides;
}
