"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import type { GenerateSettings } from "@/lib/types";
import { useMemo } from "react";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: GenerateSettings;
  onSettingsChange: (settings: GenerateSettings) => void;
}

export function SettingsPanel({
  open,
  onClose,
  settings,
  onSettingsChange,
}: SettingsPanelProps) {
  const lockedSettings = useMemo(
    () => ({
      ...settings,
      theme: "dark" as const,
      backgroundImage: undefined,
    }),
    [settings],
  );

  const update = (partial: Partial<GenerateSettings>) =>
    onSettingsChange({
      ...lockedSettings,
      ...partial,
      theme: "dark",
      backgroundImage: undefined,
    });

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[22rem] z-50 glass border-l border-white/8 p-6 pt-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Slide settings
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                aria-label="Close settings"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Lines per slide */}
            <div className="mb-6">
              <label className="text-xs font-medium text-white/50 mb-2.5 block">
                Lines per slide
              </label>
              <div className="flex gap-2">
                {([2, 3, 4] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => update({ linesPerSlide: n })}
                    className={`
                      flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer
                      ${
                        lockedSettings.linesPerSlide === n
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-white/5 text-white/40 border border-white/8 hover:bg-white/8"
                      }
                    `}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Section labels toggle */}
            <div className="mb-2">
              <label className="text-xs font-medium text-white/50 mb-2.5 block">
                Show section labels
              </label>
              <button
                onClick={() =>
                  update({
                    showSectionLabels: !lockedSettings.showSectionLabels,
                  })
                }
                className={`
                  w-12 h-7 rounded-full transition-all duration-200 relative cursor-pointer
                  ${lockedSettings.showSectionLabels ? "bg-orange-500" : "bg-white/10"}
                `}
              >
                <div
                  className={`
                    w-5 h-5 rounded-full bg-white absolute top-1 transition-transform duration-200
                    ${lockedSettings.showSectionLabels ? "translate-x-6" : "translate-x-1"}
                  `}
                />
              </button>
            </div>

            <div className="mt-7 pt-6 border-t border-white/8">
              <h3 className="text-xs font-semibold text-white/65 tracking-tight mb-4">
                Text styling
              </h3>

              {/* Font */}
              <div className="mb-5">
                <label className="text-xs font-medium text-white/50 mb-2.5 block">
                  Font
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Calibri", "Aptos", "Arial"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => update({ fontFace: f })}
                      className={`
                        py-2 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer
                        ${
                          lockedSettings.fontFace === f
                            ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                            : "bg-white/5 text-white/45 border border-white/8 hover:bg-white/8"
                        }
                      `}
                      style={{ fontFamily: f }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-white/30 leading-relaxed">
                  PowerPoint will substitute if a font isn’t installed.
                </p>
              </div>

              {/* Lyrics size */}
              <div className="mb-5">
                <label className="text-xs font-medium text-white/50 mb-2.5 block">
                  Lyrics size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: "sm" as const, label: "Small" },
                      { key: "md" as const, label: "Medium" },
                      { key: "lg" as const, label: "Large" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => update({ lyricsTextSize: opt.key })}
                      className={`
                        py-2 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer
                        ${
                          lockedSettings.lyricsTextSize === opt.key
                            ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                            : "bg-white/5 text-white/45 border border-white/8 hover:bg-white/8"
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lyrics color */}
              <div className="mb-5">
                <label className="text-xs font-medium text-white/50 mb-2.5 block">
                  Lyrics color
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { key: "default" as const, label: "Theme" },
                      { key: "soft" as const, label: "Soft" },
                      { key: "pure" as const, label: "Pure" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => update({ lyricsTextColor: opt.key })}
                      className={`
                        py-2 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer
                        ${
                          lockedSettings.lyricsTextColor === opt.key
                            ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                            : "bg-white/5 text-white/45 border border-white/8 hover:bg-white/8"
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lyrics margins */}
              <div className="mb-1">
                <label className="text-xs font-medium text-white/50 mb-2.5 block">
                  Side margins
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { key: "normal" as const, label: "Normal" },
                      { key: "wide" as const, label: "Wide" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => update({ lyricsTextMargin: opt.key })}
                      className={`
                        py-2 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer
                        ${
                          lockedSettings.lyricsTextMargin === opt.key
                            ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                            : "bg-white/5 text-white/45 border border-white/8 hover:bg-white/8"
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
