"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic, faGear } from "@fortawesome/free-solid-svg-icons";

interface HeaderProps {
  onSettingsToggle: () => void;
}

export function Header({ onSettingsToggle }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-[0_0_12px_rgba(249,115,22,0.3)]">
            <FontAwesomeIcon icon={faMusic} className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            Worshippy
          </span>
        </div>
        <button
          onClick={onSettingsToggle}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200 cursor-pointer"
          aria-label="Settings"
        >
          <FontAwesomeIcon icon={faGear} className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
