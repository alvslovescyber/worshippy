"use client";

import { useMemo, useState } from "react";
import type { SongEntry } from "@/lib/types";
import { matchBulkLyrics, parseBulkLyrics, normalizeTitleKey } from "@/lib/lyrics/bulk";

interface BulkLyricsModalProps {
  open: boolean;
  entries: SongEntry[];
  onClose: () => void;
  onApply: (updates: Array<{ entryId: string; lyrics: string }>) => void;
}

const SAMPLE = `# Firm Foundation
[Verse 1]
Line 1
Line 2

# Tremble
[Verse 1]
Line 1
Line 2
`;

export function BulkLyricsModal({
  open,
  entries,
  onClose,
  onApply,
}: BulkLyricsModalProps) {
  const [value, setValue] = useState("");

  const knownTitles = useMemo(() => entries.map((e) => e.query), [entries]);
  const titleKeyToEntryId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const e of entries) map[normalizeTitleKey(e.query)] = e.id;
    return map;
  }, [entries]);

  const parsed = useMemo(() => parseBulkLyrics(value, knownTitles), [knownTitles, value]);
  const matched = useMemo(
    () => matchBulkLyrics(parsed.blocks, titleKeyToEntryId),
    [parsed.blocks, titleKeyToEntryId],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
        aria-label="Close bulk paste"
      />

      <div className="relative w-full max-w-3xl glass rounded-3xl border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.6)]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-white tracking-tight">
                Bulk paste lyrics
              </h3>
              <p className="text-xs text-white/45 mt-1 leading-relaxed">
                Start each song with a title line (e.g.{" "}
                <span className="text-white/65"># Firm Foundation</span>), then paste the
                lyrics under it. We’ll match titles to your current set list.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-white/55 hover:text-white/75 hover:bg-white/6 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-white/8 bg-black/20">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Paste multiple songs here…"
              className="w-full bg-transparent border-0 rounded-2xl px-4 py-3 text-xs text-white/85 placeholder:text-white/25 resize-none focus:outline-none min-h-[240px] leading-relaxed"
              rows={10}
            />
          </div>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-[11px] text-white/35">
              Matched {matched.matches.length}/{entries.length} songs
              {matched.unmatched.length > 0
                ? ` • ${matched.unmatched.length} unmatched blocks`
                : ""}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setValue(SAMPLE)}
                className="px-3 py-1.5 rounded-xl text-xs bg-white/5 text-white/60 hover:bg-white/8 transition-colors cursor-pointer"
              >
                Insert sample
              </button>
              <button
                type="button"
                onClick={() => {
                  const updates = matched.matches.map((m) => ({
                    entryId: m.entryId,
                    lyrics: m.lyrics,
                  }));
                  if (updates.length === 0) return;
                  onApply(updates);
                  setValue("");
                  onClose();
                }}
                disabled={matched.matches.length === 0}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  matched.matches.length === 0
                    ? "bg-white/5 text-white/25 cursor-not-allowed"
                    : "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-[0_0_16px_rgba(249,115,22,0.25)] hover:shadow-[0_0_24px_rgba(249,115,22,0.35)]"
                }`}
              >
                Apply to set list
              </button>
            </div>
          </div>

          {matched.unmatched.length > 0 && (
            <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.02] p-3">
              <p className="text-[11px] text-white/45">
                Unmatched titles (make sure they exactly match your set list):
              </p>
              <ul className="mt-2 space-y-1">
                {matched.unmatched.slice(0, 6).map((b) => (
                  <li key={b.title} className="text-[11px] text-white/65 truncate">
                    {b.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
