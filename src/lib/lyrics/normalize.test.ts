import { describe, expect, it } from "vitest";
import { normalizeLyrics } from "@/lib/lyrics/normalize";

describe("normalizeLyrics", () => {
  it("wraps lyrics in Verse 1 when no headers exist", () => {
    const song = normalizeLyrics({
      songId: "x",
      title: "Test Song",
      raw: "Line 1\nLine 2\n\nLine 3",
    });

    expect(song.sections).toHaveLength(1);
    expect(song.sections[0]?.label).toBe("Verse 1");
    expect(song.sections[0]?.lines).toEqual(["Line 1", "Line 2", "", "Line 3"]);
  });

  it("parses bracketed headers into sections", () => {
    const song = normalizeLyrics({
      songId: "x",
      title: "Test Song",
      raw: "[Verse 1]\nA\nB\n\n[Chorus]\nC\nD",
    });

    expect(song.sections.map((s) => s.label)).toEqual(["Verse 1", "Chorus"]);
    expect(song.sections[0]?.lines).toEqual(["A", "B"]);
    expect(song.sections[1]?.lines).toEqual(["C", "D"]);
  });

  it("treats prelude lines before first header as Verse 1", () => {
    const song = normalizeLyrics({
      songId: "x",
      title: "Test Song",
      raw: "Prelude 1\nPrelude 2\n\n[Chorus]\nC1\nC2",
    });

    expect(song.sections.map((s) => s.label)).toEqual(["Verse 1", "Chorus"]);
    expect(song.sections[0]?.lines).toEqual(["Prelude 1", "Prelude 2"]);
  });
});
