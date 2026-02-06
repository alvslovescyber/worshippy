"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCircleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  visible: boolean;
  onClose: () => void;
}

export function Toast({ message, type, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100]"
        >
          <div
            className={`glass rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl ${
              type === "success"
                ? "border-emerald-500/20"
                : "border-red-500/20"
            }`}
          >
            <FontAwesomeIcon
              icon={type === "success" ? faCheck : faCircleExclamation}
              className={`w-4 h-4 ${
                type === "success" ? "text-emerald-400" : "text-red-400"
              }`}
            />
            <span className="text-sm text-white/80">{message}</span>
            <button
              onClick={onClose}
              className="ml-2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
            >
              <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
