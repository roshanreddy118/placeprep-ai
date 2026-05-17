"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  History as HistoryIcon,
  Calendar,
  CheckCircle2,
  XCircle,
  Brain,
  Code2,
  MessageSquare,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
} from "lucide-react";
import Card from "@/components/Card";

const categoryIcons: Record<string, typeof Brain> = {
  aptitude: Brain,
  coding: Code2,
  interview: MessageSquare,
  communication: TrendingUp,
  industry: Sparkles,
};

const categoryColors: Record<string, string> = {
  aptitude: "from-purple-500 to-indigo-500",
  coding: "from-blue-500 to-cyan-500",
  interview: "from-green-500 to-emerald-500",
  communication: "from-orange-500 to-amber-500",
  industry: "from-pink-500 to-rose-500",
};

interface HistoryEntry {
  date: string;
  completed: boolean;
  totalXP: number;
  results: {
    challengeId: string;
    category: string;
    correct: boolean;
    xpEarned: number;
  }[];
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/user/history")
      .then((r) => r.json())
      .then((data) => {
        if (data.history) {
          setHistory(data.history);
          if (data.history.length > 0) setExpandedDate(data.history[0].date);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    // Use IST-aware "today" calculation to match server-stored dates
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const todayStr = istNow.toISOString().split("T")[0];
    const istYesterday = new Date(istNow);
    istYesterday.setDate(istYesterday.getDate() - 1);
    const yesterdayStr = istYesterday.toISOString().split("T")[0];

    if (dateStr === todayStr) return "Today";
    if (dateStr === yesterdayStr) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-light" />
      </div>
    );
  }

  const allResults = history.flatMap((d) => d.results);
  const totalCorrect = allResults.filter((r) => r.correct).length;
  const totalXP = history.reduce((sum, d) => sum + d.totalXP, 0);
  const perfectDays = history.filter((d) => d.results.every((r) => r.correct)).length;
  const accuracy = allResults.length > 0 ? Math.round((totalCorrect / allResults.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <HistoryIcon className="w-7 h-7 text-accent-light" />
          Challenge History
        </h1>
        <p className="text-muted">Review your past performance and learn from mistakes</p>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: "Total Days", value: history.length, icon: "📅" },
          { label: "Perfect Days", value: perfectDays, icon: "⭐" },
          { label: "Total XP", value: totalXP, icon: "⚡" },
          { label: "Accuracy", value: `${accuracy}%`, icon: "🎯" },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="text-center">
              <span className="text-xl">{stat.icon}</span>
              <p className="text-lg font-bold mt-1">{stat.value}</p>
              <p className="text-xs text-muted">{stat.label}</p>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-muted shrink-0" />
        {["all", "aptitude", "coding", "interview", "communication", "industry"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === f
                ? "bg-accent/20 text-accent-light border border-accent/30"
                : "bg-card border border-border text-muted hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* History List */}
      {history.length > 0 ? (
        <div className="space-y-3">
          {history.map((entry, i) => {
            const isExpanded = expandedDate === entry.date;
            const correctCount = entry.results.filter((c) => c.correct).length;
            const filteredResults =
              filter === "all" ? entry.results : entry.results.filter((c) => c.category === filter);

            return (
              <motion.div
                key={entry.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="!p-0 overflow-hidden">
                  <button
                    onClick={() => setExpandedDate(isExpanded ? null : entry.date)}
                    className="w-full flex items-center justify-between p-4 hover:bg-card-hover transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          correctCount === entry.results.length
                            ? "bg-success/20 border border-success/30"
                            : "bg-accent/10 border border-accent/20"
                        }`}
                      >
                        {correctCount === entry.results.length ? (
                          <span className="text-lg">⭐</span>
                        ) : (
                          <Calendar className="w-5 h-5 text-accent-light" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm">{formatDate(entry.date)}</p>
                        <p className="text-xs text-muted">
                          {correctCount}/{entry.results.length} correct • +{entry.totalXP} XP
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {entry.results.map((c, j) => (
                          <div
                            key={j}
                            className={`w-2 h-2 rounded-full ${c.correct ? "bg-success" : "bg-danger"}`}
                          />
                        ))}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="border-t border-border"
                    >
                      <div className="p-4 space-y-2">
                        {filteredResults.map((result, idx) => {
                          const Icon = categoryIcons[result.category] || Brain;
                          const color = categoryColors[result.category] || "from-gray-500 to-gray-600";
                          return (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-background">
                              <div
                                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}
                              >
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium capitalize">{result.category}</p>
                                <p className="text-xs text-muted">{result.challengeId}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {result.xpEarned > 0 && (
                                  <span className="text-xs text-accent-light">+{result.xpEarned} XP</span>
                                )}
                                {result.correct ? (
                                  <CheckCircle2 className="w-4 h-4 text-success" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-danger" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-xl font-bold mb-2">No History Yet</h3>
          <p className="text-muted">Complete your first daily challenge to see your history here.</p>
        </div>
      )}
    </div>
  );
}
