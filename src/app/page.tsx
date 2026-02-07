"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  faArrowRotateRight,
  faFileArrowDown,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import { Header } from "@/components/Header";
import { Composer } from "@/components/Composer";
import { SongCard } from "@/components/SongCard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { GlassCard } from "@/components/GlassCard";
import { Toast } from "@/components/Toast";
import { BulkLyricsModal } from "@/components/BulkLyricsModal";
import type {
  Candidate,
  GenerateSettings,
  NormalizedSong,
  ParseTitlesResponse,
  SongEntry,
  SongStatus,
} from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { normalizeLyrics } from "@/lib/lyrics/normalize";
import { searchDemoCatalog } from "@/lib/providers/demoIndex";
import { splitIntoSlides } from "@/lib/lyrics/split";
import { buildPptx } from "@/lib/pptx/builder";

type ToastState =
  | { visible: false; message: ""; type: "success" | "error" }
  | { visible: true; message: string; type: "success" | "error" };

const SESSION_KEY = "worshippy_state_v1";

function parseTitlesLocal(input: string): ParseTitlesResponse {
  const raw = input
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

  if (titles.length > 20) {
    throw new Error(`Max 20 songs per batch (you sent ${titles.length}).`);
  }

  return { titles };
}

function shouldAutoSelect(candidates: Candidate[]): boolean {
  if (candidates.length === 1) return true;
  if (candidates.length === 0) return false;
  const top = candidates[0];
  const second = candidates[1];
  if (!top || !second) return true;
  return top.score >= 0.95 && top.score - second.score >= 0.2;
}

export default function Home() {
  const [settings, setSettings] = useState<GenerateSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const [entries, setEntries] = useState<SongEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [downloadedAt, setDownloadedAt] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "success",
  });

  const resetToken = useRef(0);

  // Session-only autosave/restore (ephemeral; clears when the tab closes).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") return;
      const rec = parsed as Record<string, unknown>;
      const savedEntries = rec.entries;
      const savedSettings = rec.settings;
      if (Array.isArray(savedEntries)) {
        const nextEntries = savedEntries as SongEntry[];
        setEntries(nextEntries);
        const firstNeedingLyrics = nextEntries.find((e) => e.status.phase !== "resolved");
        setEditingId(firstNeedingLyrics?.id ?? null);
      }
      if (savedSettings && typeof savedSettings === "object") {
        setSettings(savedSettings as GenerateSettings);
      }
      setToast({
        visible: true,
        type: "success",
        message: "Restored your set list from this session.",
      });
    } catch {
      // Ignore restore failures.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ entries, settings }));
      } catch {
        // Ignore save failures (e.g., storage full).
      }
    }, 150);
    return () => window.clearTimeout(t);
  }, [entries, settings]);

  const counts = useMemo(() => {
    let searching = 0;
    let needsSelection = 0;
    let ready = 0;
    let manual = 0;
    let error = 0;

    for (const entry of entries) {
      switch (entry.status.phase) {
        case "searching":
          searching += 1;
          break;
        case "candidates":
          needsSelection += 1;
          break;
        case "resolved":
          ready += 1;
          break;
        case "manual":
          manual += 1;
          break;
        case "error":
          error += 1;
          break;
      }
    }

    return {
      searching,
      needsSelection,
      ready,
      manual,
      error,
      total: entries.length,
    };
  }, [entries]);

  const allResolved = counts.total > 0 && counts.ready === counts.total;

  const resolvedSongs = useMemo(() => {
    const songs: NormalizedSong[] = [];
    for (const entry of entries) {
      if (entry.status.phase === "resolved") songs.push(entry.status.song);
    }
    return songs;
  }, [entries]);

  const updateEntryStatus = useCallback((id: string, status: SongStatus) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  }, []);

  const identifySong = useCallback((query: string) => {
    const candidates = searchDemoCatalog(query, { limit: 40, minScore: 0.18 });
    if (candidates.length === 0) {
      return { phase: "manual" as const, query, artist: undefined as string | undefined };
    }

    if (shouldAutoSelect(candidates)) {
      const top = candidates[0];
      return {
        phase: "manual" as const,
        query: top?.title ?? query,
        artist: top?.artist,
      };
    }

    return {
      phase: "candidates" as const,
      candidates,
      query,
      artist: undefined as string | undefined,
    };
  }, []);

  const addSong = useCallback(
    (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;

      const identified = identifySong(trimmed);

      const entry: SongEntry = {
        id: crypto.randomUUID(),
        query: identified.query,
        artist: identified.artist,
        status:
          identified.phase === "candidates"
            ? { phase: "candidates", candidates: identified.candidates }
            : { phase: "manual" },
      };

      let didAdd = false;
      let hitLimit = false;

      setEntries((prev) => {
        const existing = new Set(prev.map((e) => e.query.toLowerCase()));
        if (existing.has(entry.query.toLowerCase())) return prev;
        if (prev.length >= 20) {
          hitLimit = true;
          return prev;
        }
        didAdd = true;
        return [...prev, entry];
      });

      if (hitLimit) {
        setToast({
          visible: true,
          type: "error",
          message: "Max 20 songs per set list.",
        });
        return;
      }

      if (didAdd) {
        setDownloadedAt(null);
        setEditingId(entry.id);
      }
    },
    [identifySong],
  );

  const pasteSetList = useCallback(
    async (input: string) => {
      setDownloadedAt(null);
      try {
        const parsed = parseTitlesLocal(input);

        const candidates: SongEntry[] = parsed.titles.map((title) => {
          const identified = identifySong(title);
          return {
            id: crypto.randomUUID(),
            query: identified.query,
            artist: identified.artist,
            status:
              identified.phase === "candidates"
                ? { phase: "candidates", candidates: identified.candidates }
                : { phase: "manual" },
          };
        });

        setEntries((prev) => {
          const existing = new Set(prev.map((e) => e.query.toLowerCase()));
          const remainingSlots = Math.max(0, 20 - prev.length);
          const addable = candidates
            .filter((e) => !existing.has(e.query.toLowerCase()))
            .slice(0, remainingSlots);
          setEditingId(addable[0]?.id ?? null);
          return addable.length > 0 ? [...prev, ...addable] : prev;
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not add songs";
        setToast({ visible: true, type: "error", message: msg });
      }
    },
    [identifySong],
  );

  const selectCandidate = useCallback((entryId: string, candidate: Candidate) => {
    setDownloadedAt(null);
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== entryId) return e;
        return {
          ...e,
          query: candidate.title,
          artist: candidate.artist,
          status: { phase: "manual" },
        };
      }),
    );
    setEditingId(entryId);
  }, []);

  const pasteLyrics = useCallback(
    (entryId: string, query: string, artist: string | undefined, rawText: string) => {
      const song = normalizeLyrics({
        songId: `manual-${entryId}`,
        title: query,
        artist,
        raw: rawText,
      });
      updateEntryStatus(entryId, {
        phase: "resolved",
        song: { ...song, source: "manual" },
      });
      setEditingId((cur) => (cur === entryId ? null : cur));
    },
    [updateEntryStatus],
  );

  const applyBulkLyrics = useCallback(
    (updates: Array<{ entryId: string; lyrics: string }>) => {
      if (updates.length === 0) return;
      setDownloadedAt(null);
      setEditingId(null);

      const byId = new Map(updates.map((u) => [u.entryId, u.lyrics]));
      setEntries((prev) =>
        prev.map((e) => {
          const lyrics = byId.get(e.id);
          if (!lyrics) return e;
          const song = normalizeLyrics({
            songId: `manual-${e.id}`,
            title: e.query,
            artist: e.artist,
            raw: lyrics,
          });
          return {
            ...e,
            status: { phase: "resolved", song: { ...song, source: "manual" } },
          };
        }),
      );

      setToast({
        visible: true,
        type: "success",
        message: `Applied lyrics to ${updates.length} song${updates.length === 1 ? "" : "s"}.`,
      });
    },
    [],
  );

  const reset = useCallback(() => {
    resetToken.current += 1;
    setEntries([]);
    setEditingId(null);
    setGenerating(false);
    setDownloadedAt(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }, []);

  const generatePptx = useCallback(async () => {
    if (!allResolved || generating) return;

    setGenerating(true);
    try {
      const effectiveSettings: GenerateSettings = {
        ...settings,
        theme: "dark",
        backgroundImage: undefined,
      };
      const bytes = await buildPptx(
        splitIntoSlides(resolvedSongs, effectiveSettings),
        effectiveSettings,
      );
      const arrayBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      );
      const blob = new Blob([arrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `worship-set-${stamp}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setDownloadedAt(new Date().toISOString());
      setToast({ visible: true, type: "success", message: "Downloaded your deck." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not generate PPTX";
      setToast({ visible: true, type: "error", message: msg });
    } finally {
      setGenerating(false);
    }
  }, [allResolved, generating, resolvedSongs, settings]);

  return (
    <div className="min-h-screen">
      <Header onSettingsToggle={() => setSettingsOpen((o) => !o)} />

      <Toast
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ visible: false, type: "success", message: "" })}
      />

      <div className="pt-20 pb-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
                Worship lyrics decks, done.
              </h1>
              <p className="text-sm md:text-[15px] leading-relaxed text-white/45 max-w-xl">
                Add songs one-by-one (or paste a set list), paste lyrics, then download a
                polished editable PowerPoint.
              </p>
            </div>

            <Composer
              onAddSong={addSong}
              onAddCandidate={(c) => {
                const entry: SongEntry = {
                  id: crypto.randomUUID(),
                  query: c.title,
                  artist: c.artist,
                  status: { phase: "manual" },
                };

                let hitLimit = false;
                let didAdd = false;
                setEntries((prev) => {
                  const existing = new Set(prev.map((e) => e.query.toLowerCase()));
                  if (existing.has(entry.query.toLowerCase())) return prev;
                  if (prev.length >= 20) {
                    hitLimit = true;
                    return prev;
                  }
                  didAdd = true;
                  return [...prev, entry];
                });

                if (hitLimit) {
                  setToast({
                    visible: true,
                    type: "error",
                    message: "Max 20 songs per set list.",
                  });
                  return;
                }

                if (!didAdd) return;
                setDownloadedAt(null);
                setEditingId(entry.id);
              }}
              onPasteSetList={pasteSetList}
              disabled={generating}
            />

            <GlassCard noPadding className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-tight">
                    Set list
                  </h2>
                  <p className="text-xs text-white/35 mt-0.5">
                    {counts.total === 0
                      ? "Add your first song to begin."
                      : `${counts.ready}/${counts.total} ready`}
                    {counts.needsSelection > 0
                      ? ` • ${counts.needsSelection} need selection`
                      : ""}
                    {counts.manual > 0 ? ` • ${counts.manual} need lyrics` : ""}
                  </p>
                </div>
                {counts.total > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setBulkOpen(true);
                        setEditingId(null);
                      }}
                      className="text-[11px] text-white/40 hover:text-white/65 transition-colors cursor-pointer"
                    >
                      Bulk paste lyrics
                    </button>
                    <div className="text-[11px] text-white/30">Max 20 songs</div>
                  </div>
                )}
              </div>

              {counts.total === 0 ? (
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
                  <p className="text-sm text-white/55 leading-relaxed">
                    Try adding: <span className="text-white/80">Firm Foundation</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <SongCard
                      key={entry.id}
                      entry={entry}
                      onSelectCandidate={(c) => selectCandidate(entry.id, c)}
                      onPasteLyrics={(lyrics) =>
                        pasteLyrics(entry.id, entry.query, entry.artist, lyrics)
                      }
                      editorOpen={editingId === entry.id}
                      onEditorOpenChange={(open) => {
                        if (open) setEditingId(entry.id);
                        else setEditingId((cur) => (cur === entry.id ? null : cur));
                      }}
                      onRemove={() => {
                        setEntries((prev) => prev.filter((e) => e.id !== entry.id));
                        setEditingId((cur) => (cur === entry.id ? null : cur));
                      }}
                    />
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />

      <BulkLyricsModal
        open={bulkOpen}
        entries={entries}
        onClose={() => setBulkOpen(false)}
        onApply={applyBulkLyrics}
      />

      <div className="fixed bottom-6 left-0 right-0 px-6 z-30">
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-2xl px-4 py-3 border border-white/8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0 w-full">
              <p className="text-sm font-semibold text-white truncate">
                {counts.total === 0 ? "Ready when you are" : "Download your deck"}
              </p>
              <p className="text-[11px] text-white/35 mt-0.5 truncate">
                {counts.total === 0
                  ? "Add songs above to start."
                  : allResolved
                    ? downloadedAt
                      ? "Downloaded. Change settings to regenerate anytime."
                      : "All songs ready."
                    : counts.manual > 0
                      ? `${counts.manual} song${counts.manual === 1 ? "" : "s"} need lyrics before you can download.`
                      : counts.needsSelection > 0
                        ? "Select a match (optional), then paste lyrics to continue."
                        : "Paste lyrics for each song to enable download."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <SecondaryButton
                onClick={() => setSettingsOpen(true)}
                disabled={generating}
                icon={faGear}
                className="w-full sm:w-auto"
              >
                Slide settings
              </SecondaryButton>
              <SecondaryButton
                onClick={reset}
                disabled={counts.total === 0 || generating}
                icon={faArrowRotateRight}
                className="w-full sm:w-auto"
              >
                Clear list
              </SecondaryButton>
              <PrimaryButton
                onClick={generatePptx}
                disabled={!allResolved || counts.total === 0}
                loading={generating}
                icon={faFileArrowDown}
                className="w-full sm:w-auto"
              >
                {downloadedAt ? "Download again" : "Download .pptx"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
