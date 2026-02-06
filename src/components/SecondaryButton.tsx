"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: IconDefinition;
  className?: string;
}

export function SecondaryButton({
  children,
  onClick,
  disabled = false,
  icon,
  className = "",
}: SecondaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        px-4 py-2 rounded-xl
        font-medium text-sm
        transition-all duration-200 ease-out
        cursor-pointer
        border border-white/10
        ${
          disabled
            ? "text-white/30 cursor-not-allowed bg-white/3"
            : "text-white/70 hover:text-white hover:bg-white/8 hover:border-white/15 active:scale-[0.97]"
        }
        ${className}
      `}
    >
      {icon && <FontAwesomeIcon icon={icon} className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}
