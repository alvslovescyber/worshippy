import { describe, expect, it } from "vitest";
import { matchBulkLyrics, normalizeTitleKey, parseBulkLyrics } from "@/lib/lyrics/bulk";

describe("bulk lyrics", () => {
  it("parses blocks using # Title markers and matches by normalized title", () => {
    const known = ["Firm Foundation", "Tremble"];
    const input = ["# Firm Foundation", "A", "B", "", "# Tremble", "C", "D"].join("\n");

    const parsed = parseBulkLyrics(input, known);
    expect(parsed.blocks).toHaveLength(2);

    const titleKeyToEntryId = {
      [normalizeTitleKey("Firm Foundation")]: "1",
      [normalizeTitleKey("Tremble")]: "2",
    };

    const { matches, unmatched } = matchBulkLyrics(parsed.blocks, titleKeyToEntryId);
    expect(unmatched).toHaveLength(0);
    expect(matches.map((m) => m.entryId)).toEqual(["1", "2"]);
  });

  it("normalizes punctuation and case for matching", () => {
    expect(normalizeTitleKey("No One Like the Lord")).toBe(
      normalizeTitleKey("no one like the lord!"),
    );
  });
});
