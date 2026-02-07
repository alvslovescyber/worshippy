"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCircleNotch,
  faCircleExclamation,
  faMagnifyingGlass,
  faPaste,
  faChevronDown,
  faXmark,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import type { SongEntry, Candidate } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { autoFormatLyricsForEditor } from "@/lib/lyrics/format";

interface SongCardProps {
  entry: SongEntry;
  onSelectCandidate: (candidate: Candidate) => void;
  onPasteLyrics: (lyrics: string) => void;
  editorOpen?: boolean;
  onEditorOpenChange?: (open: boolean) => void;
  onRemove: () => void;
}

export function SongCard({
  entry,
  onSelectCandidate,
  onPasteLyrics,
  editorOpen,
  onEditorOpenChange,
  onRemove,
}: SongCardProps) {
  const { query, status } = entry;
  const [internalOpen, setInternalOpen] = useState(false);
  const showPaste = editorOpen ?? internalOpen;
  const [pasteText, setPasteText] = useState("");
  const [showDropdown, setShowDropdown] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const setOpen = (open: boolean) => {
    onEditorOpenChange?.(open);
    if (!onEditorOpenChange) setInternalOpen(open);
    if (!open) setShowHelp(false);
  };

  const resolvedRaw =
    status.phase === "resolved"
      ? status.song.sections
          .map((s) => `[${s.label}]\n${s.lines.join("\n")}`)
          .join("\n\n")
      : "";

  useEffect(() => {
    if (!showPaste) return;
    requestAnimationFrame(() => textareaRef.current?.focus());
    if (pasteText.trim().length > 0) return;
    if (status.phase !== "resolved") return;
    setPasteText(resolvedRaw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPaste, status.phase]);

  const template = useMemo(
    () => `[Verse 1]
Line 1
Line 2
Line 3

[Chorus]
Line 1
Line 2
Line 3
`,
    [],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass rounded-xl p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <StatusIcon status={status} />
            <h3 className="text-sm font-semibold text-white truncate">{query}</h3>
          </div>
          <StatusLabel entry={entry} />

          {/* Candidates dropdown */}
          {status.phase === "candidates" && status.candidates.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="text-xs text-white/50 hover:text-white/70 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`w-2.5 h-2.5 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                />
                Choose a match{" "}
                <span className="text-white/30">({status.candidates.length})</span>
              </button>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 space-y-1.5 overflow-hidden"
                >
                  {status.candidates.map((c: Candidate) => (
                    <button
                      key={c.id}
                      onClick={() => onSelectCandidate(c)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-white/8 transition-colors flex items-center justify-between cursor-pointer border border-white/8 bg-white/[0.02]"
                    >
                      <span className="text-white/80">
                        {c.title}
                        {c.artist && (
                          <span className="text-white/40 ml-1.5">{c.artist}</span>
                        )}
                        {c.score >= 0.95 && (
                          <span className="ml-2 text-[10px] font-semibold text-orange-300/80 border border-orange-500/20 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </span>
                      <span className="text-white/30 text-[10px]">
                        {Math.round(c.score * 100)}%
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Manual paste / edit */}
          {(status.phase === "error" ||
            status.phase === "manual" ||
            status.phase === "candidates" ||
            status.phase === "resolved") && (
            <div className="mt-3">
              {!showPaste ? (
                <button
                  onClick={() => {
                    if (status.phase === "resolved") setPasteText(resolvedRaw);
                    setOpen(true);
                  }}
                  className={
                    status.phase === "manual"
                      ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-500/20 bg-orange-500/10 text-xs text-orange-100 hover:bg-orange-500/15 transition-colors cursor-pointer font-semibold"
                      : "text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  }
                >
                  <FontAwesomeIcon icon={faPaste} className="w-3 h-3" />
                  {status.phase === "resolved" ? "Edit lyrics" : "Paste lyrics"}
                </button>
              ) : (
                <div className="space-y-2 relative">
                  <div className="rounded-xl border border-white/8 bg-black/20">
                    <textarea
                      ref={textareaRef}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder={`Paste lyrics for "${query}" here...\nAdd section headers like [Verse 1], [Chorus], [Bridge] for best results.`}
                      className="w-full bg-transparent border-0 rounded-xl px-3 py-3 text-xs text-white/85 placeholder:text-white/25 resize-none focus:outline-none min-h-[110px] leading-relaxed"
                      rows={6}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPasteText(autoFormatLyricsForEditor(pasteText))}
                      disabled={!pasteText.trim()}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/60 hover:bg-white/8 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
                      title="Cleans up formatting and organizes sections"
                    >
                      <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3 h-3" />
                      Auto-format
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHelp((s) => !s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/60 hover:bg-white/8 transition-colors cursor-pointer"
                      aria-label="Format help"
                    >
                      Help
                    </button>
                    <button
                      onClick={() => {
                        if (!pasteText.trim()) return;
                        onPasteLyrics(pasteText.trim());
                        setOpen(false);
                        setPasteText("");
                      }}
                      disabled={!pasteText.trim()}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Save lyrics
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        setPasteText("");
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  {showHelp && (
                    <div className="absolute right-0 top-0 z-10 w-[320px] max-w-full rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-3 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
                      <p className="text-[11px] text-white/70 font-semibold">
                        Preferred format
                      </p>
                      <pre className="mt-2 text-[11px] leading-relaxed text-white/70 whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[0.03] p-2">
                        {template}
                      </pre>
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPasteText((t) =>
                              t.trim().length === 0
                                ? template
                                : `${t.trim()}\n\n${template}`,
                            );
                            setShowHelp(false);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-colors cursor-pointer"
                        >
                          Insert template
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowHelp(false)}
                          className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/70 transition-colors cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-white/30 leading-relaxed">
                    Auto-format is best-effort. It may misidentify Chorus/Bridge or miss
                    section breaks — review and edit labels as needed.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={status} />
          <button
            type="button"
            onClick={onRemove}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/6 transition-colors cursor-pointer"
            aria-label={`Remove ${query}`}
          >
            <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StatusIcon({ status }: { status: SongEntry["status"] }) {
  switch (status.phase) {
    case "searching":
      return (
        <FontAwesomeIcon
          icon={faCircleNotch}
          className="w-3.5 h-3.5 text-orange-400 animate-spin"
        />
      );
    case "candidates":
      return (
        <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5 text-blue-400" />
      );
    case "resolved":
      return <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-emerald-400" />;
    case "manual":
      return <FontAwesomeIcon icon={faPaste} className="w-3.5 h-3.5 text-yellow-400" />;
    case "error":
      return (
        <FontAwesomeIcon
          icon={faCircleExclamation}
          className="w-3.5 h-3.5 text-red-400"
        />
      );
  }
}

function StatusLabel({ entry }: { entry: SongEntry }) {
  const status = entry.status;
  let text = "";
  let color = "text-white/40";

  switch (status.phase) {
    case "searching":
      text = "Working…";
      color = "text-white/40";
      break;
    case "candidates":
      text = "Pick the right song (optional)";
      color = "text-blue-400/70";
      break;
    case "resolved":
      text = status.song.artist
        ? `${status.song.artist} • ${status.song.sections.length} sections`
        : `${status.song.sections.length} sections`;
      color = "text-emerald-400/70";
      break;
    case "manual":
      text = entry.artist
        ? `${entry.artist} • paste lyrics to continue`
        : "Paste lyrics to continue";
      color = "text-yellow-400/70";
      break;
    case "error":
      text = status.message;
      color = "text-red-400/70";
      break;
  }

  return <p className={`text-xs mt-1 ml-6 ${color}`}>{text}</p>;
}

function StatusBadge({ status }: { status: SongEntry["status"] }) {
  if (status.phase === "searching") {
    return <div className="w-16 h-5 rounded-full shimmer" />;
  }
  if (status.phase === "candidates") {
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/20">
        Select
      </span>
    );
  }
  if (status.phase === "resolved") {
    if (status.song.source === "demo") {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/20">
          Demo lyrics
        </span>
      );
    }
    if (status.song.source === "manual") {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          Ready
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
        Ready
      </span>
    );
  }
  if (status.phase === "error") {
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-300 border border-red-500/20">
        Error
      </span>
    );
  }
  if (status.phase === "manual") {
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
        Needs lyrics
      </span>
    );
  }
  return null;
}
