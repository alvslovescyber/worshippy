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
} from "@fortawesome/free-solid-svg-icons";
import type { SongEntry, Candidate } from "@/lib/types";
import { useState } from "react";

interface SongCardProps {
  entry: SongEntry;
  onSelectCandidate: (songId: string) => void;
  onPasteLyrics: (lyrics: string) => void;
}

export function SongCard({
  entry,
  onSelectCandidate,
  onPasteLyrics,
}: SongCardProps) {
  const { query, status } = entry;
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [showDropdown, setShowDropdown] = useState(true);

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
            <h3 className="text-sm font-semibold text-white truncate">
              {query}
            </h3>
          </div>
          <StatusLabel status={status} />

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
                <span className="text-white/30">
                  ({status.candidates.length})
                </span>
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
                      onClick={() => onSelectCandidate(c.id)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-white/8 transition-colors flex items-center justify-between cursor-pointer border border-white/8 bg-white/[0.02]"
                    >
                      <span className="text-white/80">
                        {c.title}
                        {c.artist && (
                          <span className="text-white/40 ml-1.5">
                            {c.artist}
                          </span>
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

          {/* Error / Manual paste */}
          {(status.phase === "error" ||
            status.phase === "manual" ||
            status.phase === "candidates") && (
            <div className="mt-3">
              {!showPaste ? (
                <button
                  onClick={() => setShowPaste(true)}
                  className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FontAwesomeIcon icon={faPaste} className="w-3 h-3" />
                  Paste lyrics manually
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={`Paste lyrics for "${query}" here...\nUse [Verse 1], [Chorus], etc. for sections`}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/25 resize-none focus:outline-none focus:border-orange-500/50 min-h-[80px]"
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (pasteText.trim()) onPasteLyrics(pasteText.trim());
                      }}
                      disabled={!pasteText.trim()}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Use these lyrics
                    </button>
                    <button
                      onClick={() => {
                        setShowPaste(false);
                        setPasteText("");
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side status badge */}
        <StatusBadge status={status} />
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
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="w-3.5 h-3.5 text-blue-400"
        />
      );
    case "resolved":
      return (
        <FontAwesomeIcon
          icon={faCheck}
          className="w-3.5 h-3.5 text-emerald-400"
        />
      );
    case "manual":
      return (
        <FontAwesomeIcon
          icon={faPaste}
          className="w-3.5 h-3.5 text-yellow-400"
        />
      );
    case "error":
      return (
        <FontAwesomeIcon
          icon={faCircleExclamation}
          className="w-3.5 h-3.5 text-red-400"
        />
      );
  }
}

function StatusLabel({ status }: { status: SongEntry["status"] }) {
  let text = "";
  let color = "text-white/40";

  switch (status.phase) {
    case "searching":
      text = "Searching for lyrics...";
      color = "text-white/40";
      break;
    case "candidates":
      text = `Found ${status.candidates.length} match${status.candidates.length !== 1 ? "es" : ""}`;
      color = "text-blue-400/70";
      break;
    case "resolved":
      text = status.song.artist
        ? `${status.song.artist} - ${status.song.sections.length} sections`
        : `${status.song.sections.length} sections ready`;
      color = "text-emerald-400/70";
      break;
    case "manual":
      text = "Waiting for pasted lyrics";
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
        Choose
      </span>
    );
  }
  if (status.phase === "resolved") {
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
        Ready
      </span>
    );
  }
  if (status.phase === "error" || status.phase === "manual") {
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
        Manual
      </span>
    );
  }
  return null;
}
