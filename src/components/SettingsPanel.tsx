"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faImage } from "@fortawesome/free-solid-svg-icons";
import type { GenerateSettings } from "@/lib/types";
import { useRef } from "react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (partial: Partial<GenerateSettings>) =>
    onSettingsChange({ ...settings, ...partial });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update({ backgroundImage: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

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
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-80 z-50 glass border-l border-white/8 p-6 pt-20 overflow-y-auto md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:border-l-0 md:border-0 md:rounded-2xl md:relative md:z-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Settings
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-colors md:hidden cursor-pointer"
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
                        settings.linesPerSlide === n
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
            <div className="mb-6">
              <label className="text-xs font-medium text-white/50 mb-2.5 block">
                Show section labels
              </label>
              <button
                onClick={() =>
                  update({ showSectionLabels: !settings.showSectionLabels })
                }
                className={`
                  w-12 h-7 rounded-full transition-all duration-200 relative cursor-pointer
                  ${settings.showSectionLabels ? "bg-orange-500" : "bg-white/10"}
                `}
              >
                <div
                  className={`
                    w-5 h-5 rounded-full bg-white absolute top-1 transition-transform duration-200
                    ${settings.showSectionLabels ? "translate-x-6" : "translate-x-1"}
                  `}
                />
              </button>
            </div>

            {/* Theme */}
            <div className="mb-6">
              <label className="text-xs font-medium text-white/50 mb-2.5 block">
                Slide theme
              </label>
              <div className="flex gap-2">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => update({ theme: t })}
                    className={`
                      flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200 cursor-pointer
                      ${
                        settings.theme === t
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-white/5 text-white/40 border border-white/8 hover:bg-white/8"
                      }
                    `}
                  >
                    {t === "dark" ? "Dark Glass" : "Light Minimal"}
                  </button>
                ))}
              </div>
            </div>

            {/* Background image */}
            <div className="mb-6">
              <label className="text-xs font-medium text-white/50 mb-2.5 block">
                Background image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {settings.backgroundImage ? (
                <div className="relative rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.backgroundImage}
                    alt="Background preview"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => update({ backgroundImage: undefined })}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white/80 hover:bg-black/80 transition-colors cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 rounded-lg border border-dashed border-white/15 text-white/30 hover:border-white/25 hover:text-white/50 transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
                >
                  <FontAwesomeIcon icon={faImage} className="w-3.5 h-3.5" />
                  Upload image
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
