"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Mail,
  GraduationCap,
  Calendar,
  Target,
  LogOut,
  Trophy,
  Loader2,
} from "lucide-react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import XPBar from "@/components/XPBar";
import StreakBadge from "@/components/StreakBadge";
import BadgeDisplay from "@/components/BadgeDisplay";

const allBadges = [
  { id: "first-day", name: "First Day", icon: "🌱", description: "Complete your first challenge" },
  { id: "three-streak", name: "Hat Trick", icon: "🎯", description: "3-day streak" },
  { id: "week-streak", name: "Week Warrior", icon: "🔥", description: "7-day streak" },
  { id: "month-streak", name: "Monthly Master", icon: "💎", description: "30-day streak" },
  { id: "perfect-day", name: "Perfect Day", icon: "⭐", description: "100% in one day" },
  { id: "ten-days", name: "Dedicated", icon: "📅", description: "10 days active" },
  { id: "fifty-days", name: "Veteran", icon: "🎖️", description: "50 days active" },
  { id: "level-5", name: "Rising Star", icon: "🌟", description: "Reach Level 5" },
  { id: "level-10", name: "Expert", icon: "🏆", description: "Reach Level 10" },
  { id: "code-ninja", name: "Code Ninja", icon: "🥷", description: "10 coding problems solved" },
  { id: "aptitude-ace", name: "Aptitude Ace", icon: "🧠", description: "10 aptitude correct" },
  { id: "interview-pro", name: "Interview Pro", icon: "🎤", description: "10 interview Q's" },
];

interface ProfileData {
  user: {
    name: string;
    email: string;
    college: string;
    xp: number;
    level: number;
    streak: number;
    bestStreak: number;
    totalDaysActive: number;
    totalCorrect: number;
    totalAttempted: number;
    badges: string[];
    createdAt: string;
  };
  rank: number;
  accuracy: number;
  activeDays: Record<string, number>;
  currentLevelXP: number;
  xpPerLevel: number;
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/stats")
      .then((r) => r.json())
      .then((d) => { if (d.user) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-light" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted">Failed to load profile. Try refreshing.</p>
      </div>
    );
  }

  const { user } = data;
  const avatar = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const badges = allBadges.map((b) => ({
    ...b,
    earned: user.badges.includes(b.id),
  }));

  const xpToNext = data.xpPerLevel - data.currentLevelXP;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Profile Header */}
        <Card glow className="mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center text-3xl font-bold">
              {avatar}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
              <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-muted mb-4">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {user.college}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {joinDate}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <StreakBadge streak={user.streak} size="sm" />
                <div className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent-light">
                  Level {user.level}
                </div>
                <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs font-medium text-yellow-400">
                  Rank #{data.rank}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="w-4 h-4" />
              Log out
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* XP Progress */}
            <Card>
              <h2 className="font-semibold mb-4 flex items-center gap-2">⚡ Experience & Level</h2>
              <XPBar current={data.currentLevelXP} max={data.xpPerLevel} level={user.level} />
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-3 rounded-xl bg-background">
                  <p className="text-2xl font-bold text-accent-light">{user.xp.toLocaleString()}</p>
                  <p className="text-xs text-muted">Total XP</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-background">
                  <p className="text-2xl font-bold text-yellow-400">{user.level}</p>
                  <p className="text-xs text-muted">Level</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-background">
                  <p className="text-2xl font-bold text-success">{xpToNext}</p>
                  <p className="text-xs text-muted">XP to Level {user.level + 1}</p>
                </div>
              </div>
            </Card>

            {/* Badges */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Badges
                </h2>
                <span className="text-sm text-muted">
                  {badges.filter((b) => b.earned).length}/{badges.length} earned
                </span>
              </div>
              <BadgeDisplay badges={badges} />
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-accent-light" />
                Statistics
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Current Streak", value: `${user.streak} days`, icon: "🔥" },
                  { label: "Best Streak", value: `${user.bestStreak} days`, icon: "🏅" },
                  { label: "Total Days Active", value: String(user.totalDaysActive), icon: "📅" },
                  { label: "Problems Solved", value: String(user.totalCorrect), icon: "✅" },
                  { label: "Accuracy Rate", value: `${data.accuracy}%`, icon: "🎯" },
                  { label: "Total Attempted", value: String(user.totalAttempted), icon: "📝" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm text-muted flex items-center gap-2">
                      <span>{stat.icon}</span>
                      {stat.label}
                    </span>
                    <span className="text-sm font-semibold">{stat.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Activity Heatmap */}
            <Card>
              <h3 className="font-semibold mb-4">Activity (Last 4 Weeks)</h3>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 28 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - 27 + i);
                  const dateStr = d.toISOString().split("T")[0];
                  const xp = data.activeDays?.[dateStr] || 0;
                  const intensity = xp > 80
                    ? "bg-accent/80"
                    : xp > 40
                      ? "bg-accent/60"
                      : xp > 0
                        ? "bg-accent/30"
                        : "bg-subtle";
                  return (
                    <div
                      key={i}
                      title={`${dateStr}: ${xp} XP`}
                      className={`w-full aspect-square rounded-sm ${intensity}`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2 mt-3">
                <span className="text-xs text-muted">Less</span>
                <div className="w-3 h-3 rounded-sm bg-subtle" />
                <div className="w-3 h-3 rounded-sm bg-accent/30" />
                <div className="w-3 h-3 rounded-sm bg-accent/60" />
                <div className="w-3 h-3 rounded-sm bg-accent/80" />
                <span className="text-xs text-muted">More</span>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
