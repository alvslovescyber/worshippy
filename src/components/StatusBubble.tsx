"use client";

import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleNotch, faCheck } from "@fortawesome/free-solid-svg-icons";

interface StatusBubbleProps {
  text: string;
  done?: boolean;
}

export function StatusBubble({ text, done = false }: StatusBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2.5 py-2"
    >
      {done ? (
        <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-emerald-400" />
      ) : (
        <FontAwesomeIcon
          icon={faCircleNotch}
          className="w-3 h-3 text-orange-400 animate-spin"
        />
      )}
      <span className={`text-xs ${done ? "text-white/40" : "text-white/60"}`}>
        {text}
      </span>
    </motion.div>
  );
}
