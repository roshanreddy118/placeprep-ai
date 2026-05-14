"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Zap,
  Brain,
  Code2,
  MessageSquare,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Calendar,
  Target,
  Trophy,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import StreakBadge from "@/components/StreakBadge";
import ProgressRing from "@/components/ProgressRing";
import XPBar from "@/components/XPBar";

const challengeTypes = [
  { id: "aptitude", icon: Brain, title: "Aptitude Question", color: "from-purple-500 to-indigo-500", xp: 20 },
  { id: "coding", icon: Code2, title: "Coding Problem", color: "from-blue-500 to-cyan-500", xp: 30 },
  { id: "interview", icon: MessageSquare, title: "Interview Question", color: "from-green-500 to-emerald-500", xp: 20 },
  { id: "communication", icon: TrendingUp, title: "Communication Tip", color: "from-orange-500 to-amber-500", xp: 15 },
  { id: "industry", icon: Sparkles, title: "Industry Update", color: "from-pink-500 to-rose-500", xp: 15 },
];

interface StatsData {
  user: {
    name: string;
    xp: number;
    level: number;
    streak: number;
    bestStreak: number;
    totalDaysActive: number;
    totalCorrect: number;
    totalAttempted: number;
    badges: string[];
  };
  rank: number;
  accuracy: number;
  todayProgress: {
    completed: boolean;
    results: { challengeId: string; category: string; correct: boolean; xpEarned: number }[];
    totalXP: number;
  } | null;
  weekActivity: { day: string; completed: boolean }[];
  currentLevelXP: number;
  xpPerLevel: number;
}

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [topPlayers, setTopPlayers] = useState<{ name: string; xp: number; rank: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/stats").then((r) => r.json()),
      fetch("/api/leaderboard").then((r) => r.json()),
    ])
      .then(([statsData, lbData]) => {
        if (statsData.user) setStats(statsData);
        if (lbData.leaderboard) {
          setTopPlayers(
            lbData.leaderboard.slice(0, 3).map((p: { name: string; xp: number; rank: number }) => ({
              name: p.name,
              xp: p.xp,
              rank: p.rank,
            }))
          );
        }
      })
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

  if (!stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted">Failed to load dashboard. Try refreshing.</p>
      </div>
    );
  }

  const completedIds = new Set(
    stats.todayProgress?.results.map((r) => r.category) || []
  );
  const completedCount = completedIds.size;
  const progress = (completedCount / 5) * 100;
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
      ? "Good afternoon"
      : "Good evening";

  const xpToNext = stats.xpPerLevel - stats.currentLevelXP;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div variants={stagger} initial="initial" animate="animate">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold mb-1">
              {greeting}, <span className="gradient-text">{stats.user.name}</span> 👋
            </h1>
            <p className="text-muted">
              {completedCount === 5
                ? "All challenges completed today! Great work!"
                : "Complete today's challenges to keep your streak alive!"}
            </p>
          </div>
          <StreakBadge streak={stats.user.streak} size="lg" />
        </motion.div>

        {/* Stats Row */}
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Current Streak", value: `${stats.user.streak} Days`, icon: "🔥", color: "text-orange-400" },
            { label: "Total XP", value: stats.user.xp.toLocaleString(), icon: "⚡", color: "text-yellow-400" },
            { label: "Global Rank", value: `#${stats.rank}`, icon: "🏆", color: "text-amber-400" },
            { label: "Accuracy", value: `${stats.accuracy}%`, icon: "🎯", color: "text-green-400" },
          ].map((stat) => (
            <Card key={stat.label}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Challenges */}
            <motion.div variants={fadeUp}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent-light" />
                  Today&apos;s Challenges
                </h2>
                <span className="text-sm text-muted">{completedCount}/5 completed</span>
              </div>

              <div className="space-y-3">
                {challengeTypes.map((challenge, i) => {
                  const isDone = completedIds.has(challenge.id);
                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link href="/challenge">
                        <Card hover className="!p-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${challenge.color} flex items-center justify-center shrink-0 ${
                                !isDone && completedCount < i ? "opacity-40" : ""
                              }`}
                            >
                              <challenge.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm">{challenge.title}</h3>
                              <p className="text-xs text-muted">+{challenge.xp} XP</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {isDone ? (
                                <CheckCircle2 className="w-5 h-5 text-success" />
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-border" />
                              )}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              <Link href="/challenge" className="block mt-4">
                <Button className="w-full" size="lg">
                  {completedCount === 5 ? "Review Challenges" : "Continue Challenge"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Week Activity */}
            <motion.div variants={fadeUp}>
              <Card>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent-light" />
                  This Week
                </h3>
                <div className="flex items-center justify-between">
                  {stats.weekActivity.map((day) => (
                    <div key={day.day} className="flex flex-col items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                          day.completed
                            ? "bg-success/20 border border-success/30"
                            : "bg-white/5 border border-border"
                        }`}
                      >
                        {day.completed ? "✅" : ""}
                      </div>
                      <span className="text-xs text-muted">{day.day}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Ring */}
            <motion.div variants={fadeUp}>
              <Card className="text-center" glow>
                <h3 className="font-semibold mb-4">Today&apos;s Progress</h3>
                <div className="flex justify-center mb-4">
                  <ProgressRing progress={progress} size={140} strokeWidth={10}>
                    <div>
                      <p className="text-3xl font-bold">{completedCount}</p>
                      <p className="text-xs text-muted">of 5</p>
                    </div>
                  </ProgressRing>
                </div>
                <p className="text-sm text-muted">
                  {completedCount === 5
                    ? "All done for today!"
                    : `${5 - completedCount} challenges remaining`}
                </p>
              </Card>
            </motion.div>

            {/* XP */}
            <motion.div variants={fadeUp}>
              <Card>
                <h3 className="font-semibold mb-4 flex items-center gap-2">⚡ Experience Points</h3>
                <XPBar current={stats.currentLevelXP} max={stats.xpPerLevel} level={stats.user.level} />
                <p className="text-xs text-muted mt-3">{xpToNext} XP to reach Level {stats.user.level + 1}</p>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={fadeUp}>
              <Card>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent-light" />
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Best Streak", value: `${stats.user.bestStreak} days`, icon: "🔥" },
                    { label: "Problems Solved", value: String(stats.user.totalCorrect), icon: "✅" },
                    { label: "Badges Earned", value: String(stats.user.badges.length), icon: "🏅" },
                    { label: "Days Active", value: String(stats.user.totalDaysActive), icon: "📅" },
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
            </motion.div>

            {/* Leaderboard Preview */}
            <motion.div variants={fadeUp}>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    Top Players
                  </h3>
                  <Link href="/leaderboard" className="text-xs text-accent-light hover:underline">
                    View all
                  </Link>
                </div>
                <div className="space-y-2">
                  {topPlayers.length > 0 ? (
                    topPlayers.map((player) => (
                      <div key={player.rank} className="flex items-center gap-3 py-2">
                        <span className="text-lg">
                          {player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : "🥉"}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{player.name}</p>
                          <p className="text-xs text-muted">{player.xp.toLocaleString()} XP</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted">No players yet. Be the first!</p>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
