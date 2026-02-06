"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  faArrowRotateRight,
  faFileArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import { Header } from "@/components/Header";
import { Composer } from "@/components/Composer";
import { SongCard } from "@/components/SongCard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SecondaryButton } from "@/components/SecondaryButton";
import { GlassCard } from "@/components/GlassCard";
import { Toast } from "@/components/Toast";
import type {
  Candidate,
  GenerateRequest,
  GenerateSettings,
  NormalizedSong,
  ParseTitlesResponse,
  SearchResponse,
  SongEntry,
  SongStatus,
} from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { normalizeLyrics } from "@/lib/lyrics/normalize";

type ToastState =
  | { visible: false; message: ""; type: "success" | "error" }
  | { visible: true; message: string; type: "success" | "error" };

function issuesToMessage(issues: unknown): string | null {
  if (!Array.isArray(issues)) return null;
  const first = issues[0] as { message?: unknown } | undefined;
  return typeof first?.message === "string" ? first.message : null;
}

function errorPayloadToMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.error === "string") return record.error;
  return issuesToMessage(record.error);
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const msg = errorPayloadToMessage(payload) ?? "Request failed";
    throw new Error(msg);
  }

  return payload as T;
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
  const [isDesktop, setIsDesktop] = useState(false);

  const [entries, setEntries] = useState<SongEntry[]>([]);
  const [batchBusy, setBatchBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloadedAt, setDownloadedAt] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "success",
  });

  const activeBatchId = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsDesktop(mq.matches);
    apply();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
    mq.addListener(apply);
    return () => mq.removeListener(apply);
  }, []);

  const effectiveSettingsOpen = settingsOpen || isDesktop;

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

  const handleSubmitTitles = useCallback(
    async (input: string) => {
      const batchId = ++activeBatchId.current;
      setBatchBusy(true);
      setDownloadedAt(null);
      setEntries([]);

      try {
        const parsed = await postJson<ParseTitlesResponse>("/api/parse-titles", {
          input,
        });

        if (batchId !== activeBatchId.current) return;

        const initial: SongEntry[] = parsed.titles.map((title) => ({
          id: crypto.randomUUID(),
          query: title,
          status: { phase: "searching" },
        }));

        setEntries(initial);

        await Promise.allSettled(
          initial.map(async (entry) => {
            try {
              const res = await postJson<SearchResponse>("/api/search", {
                query: entry.query,
              });

              if (batchId !== activeBatchId.current) return;

              if (res.candidates.length === 0) {
                updateEntryStatus(entry.id, { phase: "manual" });
                return;
              }

              if (shouldAutoSelect(res.candidates)) {
                if (res.topMatch) {
                  updateEntryStatus(entry.id, {
                    phase: "resolved",
                    song: res.topMatch,
                  });
                  return;
                }

                const topId = res.candidates[0]?.id;
                if (!topId) {
                  updateEntryStatus(entry.id, {
                    phase: "error",
                    message: "No matches found.",
                  });
                  return;
                }

                const lyrics = await postJson<{
                  songId: string;
                  song: NormalizedSong;
                }>("/api/lyrics", { songId: topId });

                if (batchId !== activeBatchId.current) return;

                updateEntryStatus(entry.id, {
                  phase: "resolved",
                  song: lyrics.song,
                });
                return;
              }

              updateEntryStatus(entry.id, {
                phase: "candidates",
                candidates: res.candidates,
              });
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Search failed";
              updateEntryStatus(entry.id, { phase: "error", message: msg });
            }
          }),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not parse titles";
        setToast({ visible: true, type: "error", message: msg });
      } finally {
        if (batchId === activeBatchId.current) setBatchBusy(false);
      }
    },
    [updateEntryStatus],
  );

  const resolveCandidate = useCallback(
    async (entryId: string, songId: string) => {
      updateEntryStatus(entryId, { phase: "searching" });
      try {
        const lyrics = await postJson<{ songId: string; song: NormalizedSong }>(
          "/api/lyrics",
          { songId },
        );
        updateEntryStatus(entryId, { phase: "resolved", song: lyrics.song });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not load lyrics";
        updateEntryStatus(entryId, { phase: "error", message: msg });
      }
    },
    [updateEntryStatus],
  );

  const pasteLyrics = useCallback(
    (entryId: string, query: string, rawText: string) => {
      const song = normalizeLyrics({
        songId: `manual-${entryId}`,
        title: query,
        raw: rawText,
      });
      updateEntryStatus(entryId, { phase: "resolved", song });
    },
    [updateEntryStatus],
  );

  const reset = useCallback(() => {
    activeBatchId.current += 1;
    setEntries([]);
    setBatchBusy(false);
    setGenerating(false);
    setDownloadedAt(null);
  }, []);

  const generatePptx = useCallback(async () => {
    if (!allResolved || generating) return;

    setGenerating(true);
    try {
      const payload: GenerateRequest = { songs: resolvedSongs, settings };

      const res = await fetch("/api/generate-ppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errPayload = (await res.json().catch(() => null)) as unknown;
        throw new Error(
          errorPayloadToMessage(errPayload) ?? "Generation failed",
        );
      }

      const blob = await res.blob();
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
          <div className="grid grid-cols-1 md:grid-cols-[1fr_20rem] gap-6 items-start">
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-[34px] font-semibold tracking-tight text-white">
                  Worship lyrics decks, done.
                </h1>
                <p className="text-sm md:text-[15px] leading-relaxed text-white/45 max-w-xl">
                  Paste one or many song titles. Resolve any matches, tweak slide
                  settings, then download a polished editable PowerPoint.
                </p>
              </div>

              <Composer onSubmit={handleSubmitTitles} disabled={batchBusy || generating} />

              <GlassCard noPadding className="p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-white tracking-tight">
                      Set list
                    </h2>
                    <p className="text-xs text-white/35 mt-0.5">
                      {counts.total === 0 ? "Add songs to begin." : `${counts.ready}/${counts.total} ready`}
                      {counts.needsSelection > 0 ? ` • ${counts.needsSelection} need selection` : ""}
                      {counts.manual > 0 ? ` • ${counts.manual} manual` : ""}
                    </p>
                  </div>
                  {counts.total > 0 && (
                    <div className="text-[11px] text-white/30">
                      Max 20 songs per batch
                    </div>
                  )}
                </div>

                {counts.total === 0 ? (
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
                    <p className="text-sm text-white/55 leading-relaxed">
                      Try: <span className="text-white/80">Firm Foundation</span>,{" "}
                      <span className="text-white/80">Tremble</span>,{" "}
                      <span className="text-white/80">Goodness of God</span>
                    </p>
                    <p className="text-xs text-white/35 mt-2">
                      Tip: comma or newline-separated. Press Cmd+Enter to submit.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {entries.map((entry) => (
                      <SongCard
                        key={entry.id}
                        entry={entry}
                        onSelectCandidate={(songId) => resolveCandidate(entry.id, songId)}
                        onPasteLyrics={(lyrics) => pasteLyrics(entry.id, entry.query, lyrics)}
                      />
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>

            <div className="md:block">
              <SettingsPanel
                open={effectiveSettingsOpen}
                onClose={() => setSettingsOpen(false)}
                settings={settings}
                onSettingsChange={setSettings}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-6 z-30">
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-2xl px-4 py-3 border border-white/8 shadow-[0_20px_60px_rgba(0,0,0,0.45)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0 w-full">
              <p className="text-sm font-semibold text-white truncate">
                {counts.total === 0 ? "Ready when you are" : "Download your deck"}
              </p>
              <p className="text-[11px] text-white/35 mt-0.5 truncate">
                {counts.total === 0
                  ? "Paste titles above to start."
                  : allResolved
                    ? downloadedAt
                      ? "Downloaded. Change settings to regenerate anytime."
                      : "All songs ready."
                    : batchBusy
                      ? "Resolving songs…"
                      : "Resolve remaining songs to enable download."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <SecondaryButton
                onClick={reset}
                disabled={counts.total === 0 || generating}
                icon={faArrowRotateRight}
                className="w-full sm:w-auto"
              >
                {batchBusy ? "Cancel" : "Generate another"}
              </SecondaryButton>
              <PrimaryButton
                onClick={generatePptx}
                disabled={!allResolved || batchBusy || counts.total === 0}
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
