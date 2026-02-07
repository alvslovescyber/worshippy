"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faPlus } from "@fortawesome/free-solid-svg-icons";
import type { Candidate, SearchResponse } from "@/lib/types";

interface ComposerProps {
  onAddSong: (title: string) => void;
  onAddCandidate?: (candidate: Candidate) => void;
  onPasteSetList: (input: string) => void;
  disabled?: boolean;
}

export function Composer({
  onAddSong,
  onAddCandidate,
  onPasteSetList,
  disabled = false,
}: ComposerProps) {
  const [mode, setMode] = useState<"single" | "paste">("single");
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Candidate[]>([]);
  const [suggestBusy, setSuggestBusy] = useState(false);
  const suggestReqId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSuggest = useMemo(() => mode === "single" && value.trim().length >= 2, [mode, value]);

  useEffect(() => {
    if (!canSuggest || disabled) {
      setSuggestions([]);
      setSuggestBusy(false);
      return;
    }

    const id = ++suggestReqId.current;
    setSuggestBusy(true);
    const q = value.trim();

    const t = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, suggestOnly: true }),
        });
        const payload = (await res.json().catch(() => null)) as unknown;
        if (id !== suggestReqId.current) return;
        if (!res.ok || !payload || typeof payload !== "object") {
          setSuggestions([]);
          return;
        }
        const data = payload as SearchResponse;
        setSuggestions(Array.isArray(data.candidates) ? data.candidates.slice(0, 8) : []);
      } finally {
        if (id === suggestReqId.current) setSuggestBusy(false);
      }
    }, 220);

    return () => window.clearTimeout(t);
  }, [canSuggest, disabled, mode, value]);

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onAddSong(trimmed);
    setValue("");
    inputRef.current?.focus();
  };

  const handlePasteSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onPasteSetList(trimmed);
    setValue("");
    setMode("single");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && mode === "single") {
      e.preventDefault();
      handleAdd();
    }

    // Cmd/Ctrl+Enter to submit paste list
    if (e.key === "Enter" && mode === "paste" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePasteSubmit();
    }
  };

  return (
    <div className="glass rounded-2xl p-3">
      {mode === "single" ? (
        <>
          <div className="flex items-end gap-3 relative">
            <div className="flex-1 min-w-0">
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a song title…"
                disabled={disabled}
                className="w-full bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none py-2 px-1 disabled:opacity-40"
              />

              {(suggestBusy || suggestions.length > 0) && (
                <div className="mt-2 rounded-xl border border-white/10 bg-black/30 backdrop-blur-xl overflow-hidden">
                  {suggestBusy && suggestions.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-white/35">Searching…</div>
                  ) : (
                    <div className="divide-y divide-white/8">
                      {suggestions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            if (disabled) return;
                            if (onAddCandidate) onAddCandidate(c);
                            else onAddSong(c.title);
                            setValue("");
                            setSuggestions([]);
                            inputRef.current?.focus();
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-white/6 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <span className="text-xs text-white/80 truncate">
                            {c.title}
                            {c.artist ? (
                              <span className="text-white/35"> • {c.artist}</span>
                            ) : null}
                          </span>
                          <span className="text-[10px] text-white/25 flex-shrink-0">
                            {Math.round(c.score * 100)}%
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleAdd}
              disabled={!value.trim() || disabled}
              className={`
                flex-shrink-0 h-10 px-3 rounded-xl flex items-center justify-center gap-2
                transition-all duration-200 cursor-pointer text-sm font-semibold
                ${
                  !value.trim() || disabled
                    ? "bg-white/5 text-white/20 cursor-not-allowed"
                    : "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-[0_0_16px_rgba(249,115,22,0.3)] hover:shadow-[0_0_24px_rgba(249,115,22,0.45)] active:scale-95"
                }
              `}
              aria-label="Add song"
            >
              <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <p className="text-[11px] text-white/25">
              Press Enter to add.
            </p>
            <button
              type="button"
              onClick={() => {
                setValue("");
                setMode("paste");
                requestAnimationFrame(() => textareaRef.current?.focus());
              }}
              className="text-[11px] text-white/35 hover:text-white/55 transition-colors cursor-pointer"
              disabled={disabled}
            >
              Paste a set list
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={"Paste your set list here…\nOne song per line works best."}
                disabled={disabled}
                rows={4}
                className="w-full bg-transparent text-sm text-white placeholder:text-white/25 resize-none focus:outline-none py-2 px-1 max-h-56 overflow-y-auto leading-relaxed disabled:opacity-40"
              />
            </div>
            <button
              onClick={handlePasteSubmit}
              disabled={!value.trim() || disabled}
              className={`
                flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                transition-all duration-200 cursor-pointer
                ${
                  !value.trim() || disabled
                    ? "bg-white/5 text-white/20 cursor-not-allowed"
                    : "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-[0_0_16px_rgba(249,115,22,0.3)] hover:shadow-[0_0_24px_rgba(249,115,22,0.45)] active:scale-95"
                }
              `}
              aria-label="Add songs"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <p className="text-[11px] text-white/25">
              Tip: Cmd/Ctrl+Enter to add quickly.
            </p>
            <button
              type="button"
              onClick={() => {
                setValue("");
                setMode("single");
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className="text-[11px] text-white/35 hover:text-white/55 transition-colors cursor-pointer"
              disabled={disabled}
            >
              Back to single add
            </button>
          </div>
        </>
      )}
    </div>
  );
}
