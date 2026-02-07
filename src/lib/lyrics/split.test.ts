import { describe, expect, it } from "vitest";
import { splitIntoSlides } from "@/lib/lyrics/split";
import type { NormalizedSong, GenerateSettings } from "@/lib/types";

describe("splitIntoSlides", () => {
  it("adds a cover slide and a title slide per song", () => {
    const songs: NormalizedSong[] = [
      {
        title: "Song A",
        artist: "Artist A",
        sections: [{ label: "Verse 1", lines: ["a", "b", "c"] }],
      },
      {
        title: "Song B",
        sections: [{ label: "Verse 1", lines: ["d"] }],
      },
    ];

    const settings: GenerateSettings = {
      linesPerSlide: 3,
      showSectionLabels: false,
      theme: "dark",
    };

    const slides = splitIntoSlides(songs, settings);
    expect(slides[0]?.type).toBe("cover");
    expect(slides.filter((s) => s.type === "title")).toHaveLength(2);
  });

  it("chunks lines per slide and avoids a single orphan line at the end", () => {
    const songs: NormalizedSong[] = [
      {
        title: "Song A",
        sections: [
          {
            label: "Verse 1",
            lines: ["1", "2", "3", "4", "5", "6", "7"],
          },
        ],
      },
    ];

    const settings: GenerateSettings = {
      linesPerSlide: 3,
      showSectionLabels: false,
      theme: "dark",
    };

    const slides = splitIntoSlides(songs, settings);
    const lyricSlides = slides.filter((s) => s.type === "lyrics");

    // 7 lines with max=3 becomes [3,2,2] after balancing.
    expect(lyricSlides.map((s) => s.lines?.length)).toEqual([3, 2, 2]);
  });

  it("adds section labels only when enabled", () => {
    const songs: NormalizedSong[] = [
      {
        title: "Song A",
        sections: [{ label: "Chorus", lines: ["a", "b"] }],
      },
    ];

    const base: Omit<GenerateSettings, "showSectionLabels"> = {
      linesPerSlide: 3,
      theme: "dark",
    };

    const withLabels = splitIntoSlides(songs, { ...base, showSectionLabels: true });
    const withoutLabels = splitIntoSlides(songs, { ...base, showSectionLabels: false });

    expect(withLabels.find((s) => s.type === "lyrics")?.sectionLabel).toBe("Chorus");
    expect(withoutLabels.find((s) => s.type === "lyrics")?.sectionLabel).toBeUndefined();
  });
});
