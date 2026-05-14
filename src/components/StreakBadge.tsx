"use client";

import { motion } from "framer-motion";

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

export default function StreakBadge({ streak, size = "md" }: StreakBadgeProps) {
  const sizes = {
    sm: { container: "px-2 py-1", icon: "text-lg", text: "text-xs" },
    md: { container: "px-3 py-1.5", icon: "text-2xl", text: "text-sm" },
    lg: { container: "px-5 py-3", icon: "text-4xl", text: "text-xl" },
  };

  const s = sizes[size];

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center gap-2 ${s.container} rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 shadow-lg shadow-orange-500/15`}
    >
      <span className={`${s.icon} streak-fire`}>🔥</span>
      <div className="flex flex-col">
        <span className={`font-bold text-orange-400 ${s.text}`}>
          {streak} Day{streak !== 1 ? "s" : ""}
        </span>
        {size === "lg" && (
          <span className="text-xs text-muted">Current Streak</span>
        )}
      </div>
    </motion.div>
  );
}
