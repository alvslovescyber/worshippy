import { describe, expect, it } from "vitest";
import { buildPptx } from "@/lib/pptx/builder";
import type { GenerateSettings, SlideContent } from "@/lib/types";

describe("buildPptx", () => {
  it("produces a non-empty PPTX (zip) byte array", async () => {
    const slides: SlideContent[] = [
      { type: "cover", title: "Worship Set", date: "January 1, 2026" },
      { type: "title", title: "Song A", artist: "Artist A" },
      {
        type: "lyrics",
        sectionLabel: "Verse 1",
        lines: ["Line 1", "Line 2", "Line 3"],
      },
    ];

    const settings: GenerateSettings = {
      linesPerSlide: 3,
      showSectionLabels: true,
      theme: "dark",
    };

    const bytes = await buildPptx(slides, settings);
    expect(bytes.byteLength).toBeGreaterThan(1000);
    // PPTX is a ZIP: should start with "PK".
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });
});
