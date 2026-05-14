"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";

interface BadgeDisplayProps {
  badges: {
    id: string;
    name: string;
    icon: string;
    description: string;
    earned: boolean;
  }[];
}

export default function BadgeDisplay({ badges }: BadgeDisplayProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
      {badges.map((badge, i) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
            badge.earned
              ? "bg-accent/10 border-accent/30 hover:bg-accent/20"
              : "bg-card border-border opacity-40"
          }`}
        >
          <div className="text-3xl">
            {badge.earned ? badge.icon : <Lock className="w-6 h-6 text-muted" />}
          </div>
          <span className="text-xs text-center font-medium leading-tight">
            {badge.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
