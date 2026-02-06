"use client";

import { useState, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

interface ComposerProps {
  onSubmit: (input: string) => void;
  disabled?: boolean;
}

export function Composer({ onSubmit, disabled = false }: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl+Enter to submit
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="glass rounded-2xl p-3">
      <div className="flex items-end gap-3">
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter song titles (comma or newline separated)..."
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent text-sm text-white placeholder:text-white/25 resize-none focus:outline-none py-2 px-1 max-h-40 overflow-y-auto leading-relaxed disabled:opacity-40"
          />
        </div>
        <button
          onClick={handleSubmit}
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
          aria-label="Submit songs"
        >
          <FontAwesomeIcon icon={faPaperPlane} className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-[11px] text-white/25 mt-1.5 px-1">
        Comma or newline separated. Press Cmd+Enter to submit.
      </p>
    </div>
  );
}
