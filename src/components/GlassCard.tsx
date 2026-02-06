"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function GlassCard({
  children,
  className = "",
  noPadding = false,
  ...rest
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`glass rounded-2xl ${noPadding ? "" : "p-6"} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
