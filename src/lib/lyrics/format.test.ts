import { describe, expect, it } from "vitest";
import { autoFormatLyricsForEditor } from "@/lib/lyrics/format";

describe("autoFormatLyricsForEditor", () => {
  it("removes common metadata and chord-only lines", () => {
    const formatted = autoFormatLyricsForEditor(
      ["CCLI Song # 123", "Key: G", "G D Em C", "", "Real line 1", "Real line 2"].join(
        "\n",
      ),
    );

    expect(formatted).not.toMatch(/CCLI Song/i);
    expect(formatted).not.toMatch(/Key:/i);
    expect(formatted).not.toMatch(/^G D Em C$/m);
    expect(formatted).toMatch(/Real line 1/);
  });

  it("infers a chorus when a stanza repeats", () => {
    const formatted = autoFormatLyricsForEditor(
      [
        "Verse line 1",
        "Verse line 2",
        "",
        "Chorus line 1",
        "Chorus line 2",
        "",
        "Verse 2 line 1",
        "Verse 2 line 2",
        "",
        "Chorus line 1",
        "Chorus line 2",
      ].join("\n"),
    );

    expect(formatted).toMatch(/\[Chorus\]/);
    expect(formatted).toMatch(/\[Verse 1\]/);
  });

  it("splits very long single blocks into multiple verses", () => {
    const lines = Array.from({ length: 18 }, (_, i) => `Line ${i + 1}`);
    const formatted = autoFormatLyricsForEditor(lines.join("\n"));
    expect(formatted).toMatch(/\[Verse 1\]/);
    expect(formatted).toMatch(/\[Verse 2\]/);
  });
});
