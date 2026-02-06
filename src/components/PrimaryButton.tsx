"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconDefinition;
  className?: string;
  type?: "button" | "submit";
}

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  icon,
  className = "",
  type = "button",
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative inline-flex items-center justify-center gap-2.5
        px-6 py-3 rounded-xl
        font-semibold text-sm
        text-white
        transition-all duration-200 ease-out
        cursor-pointer
        ${
          isDisabled
            ? "bg-orange-500/30 text-white/40 cursor-not-allowed"
            : "bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.25)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] active:scale-[0.97]"
        }
        ${className}
      `}
    >
      {loading ? (
        <FontAwesomeIcon icon={faCircleNotch} className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <FontAwesomeIcon icon={icon} className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}
