"use client";

import { motion } from "framer-motion";

interface XPBarProps {
  current: number;
  max: number;
  level: number;
}

export default function XPBar({ current, max, level }: XPBarProps) {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center text-sm font-bold">
            {level}
          </div>
          <span className="text-sm font-medium">Level {level}</span>
        </div>
        <span className="text-xs text-muted">
          {current}/{max} XP
        </span>
      </div>
      <div className="h-3 bg-subtle rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent to-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
