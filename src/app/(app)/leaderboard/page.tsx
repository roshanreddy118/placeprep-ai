"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Flame,
  Crown,
  Search,
  Loader2,
} from "lucide-react";
import Card from "@/components/Card";

interface Player {
  rank: number;
  name: string;
  college: string;
  xp: number;
  level: number;
  streak: number;
  avatar: string;
}

const rankColors: Record<number, string> = {
  1: "from-yellow-400 to-amber-500",
  2: "from-gray-300 to-gray-400",
  3: "from-orange-400 to-amber-600",
};

const rankIcons: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [myRank, setMyRank] = useState<{ rank: number; name: string; xp: number; avatar: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/leaderboard").then((r) => r.json()),
      fetch("/api/user/stats").then((r) => r.json()),
    ])
      .then(([lbData, statsData]) => {
        if (lbData.leaderboard) setPlayers(lbData.leaderboard);
        if (statsData.user) {
          setMyRank({
            rank: statsData.rank,
            name: statsData.user.name,
            xp: statsData.user.xp,
            avatar: statsData.user.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2),
          });
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

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-muted">Top placement preppers ranked by XP</p>
        </motion.div>
      </div>

      {/* Top 3 Podium */}
      {players.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-end justify-center gap-4 mb-10"
        >
          {/* 2nd Place */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-xl font-bold text-black mb-2">
              {players[1].avatar}
            </div>
            <p className="font-semibold text-sm">{players[1].name.split(" ")[0]}</p>
            <p className="text-xs text-muted">{players[1].xp.toLocaleString()} XP</p>
            <div className="w-20 h-20 bg-gray-500/20 rounded-t-lg mt-2 flex items-center justify-center">
              <span className="text-3xl">🥈</span>
            </div>
          </div>

          {/* 1st Place */}
          <div className="text-center -mt-4">
            <div className="relative">
              <Crown className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-2xl font-bold text-black mb-2 ring-4 ring-yellow-500/30">
                {players[0].avatar}
              </div>
            </div>
            <p className="font-semibold">{players[0].name.split(" ")[0]}</p>
            <p className="text-xs text-muted">{players[0].xp.toLocaleString()} XP</p>
            <div className="w-20 h-28 bg-yellow-500/20 rounded-t-lg mt-2 flex items-center justify-center">
              <span className="text-4xl">🥇</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-xl font-bold text-black mb-2">
              {players[2].avatar}
            </div>
            <p className="font-semibold text-sm">{players[2].name.split(" ")[0]}</p>
            <p className="text-xs text-muted">{players[2].xp.toLocaleString()} XP</p>
            <div className="w-20 h-16 bg-orange-500/20 rounded-t-lg mt-2 flex items-center justify-center">
              <span className="text-3xl">🥉</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div className="flex items-center justify-end mb-6">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players..."
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
      </div>

      {/* Your Rank */}
      {myRank && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <Card className="!p-3 bg-accent/5 border-accent/20">
            <div className="flex items-center gap-4">
              <div className="w-8 text-center font-bold text-accent-light">#{myRank.rank}</div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center font-bold text-sm">
                {myRank.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">
                  {myRank.name} <span className="text-xs text-accent-light">(You)</span>
                </p>
              </div>
              <div className="text-center">
                <p className="font-bold">{myRank.xp.toLocaleString()}</p>
                <p className="text-xs text-muted">XP</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Leaderboard List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((player, i) => (
            <motion.div
              key={player.rank}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Card className="!p-3" hover>
                <div className="flex items-center gap-4">
                  <div className="w-8 text-center">
                    {player.rank <= 3 ? (
                      <span className="text-xl">{rankIcons[player.rank]}</span>
                    ) : (
                      <span className="font-bold text-muted">#{player.rank}</span>
                    )}
                  </div>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      player.rank <= 3
                        ? `bg-gradient-to-br ${rankColors[player.rank]} text-black`
                        : "bg-card border border-border"
                    }`}
                  >
                    {player.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{player.name}</p>
                    <p className="text-xs text-muted">{player.college}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center hidden sm:block">
                      <p className="font-bold">{player.xp.toLocaleString()}</p>
                      <p className="text-xs text-muted">XP</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        {player.streak}
                      </p>
                      <p className="text-xs text-muted">Streak</p>
                    </div>
                    <div className="text-center w-12">
                      <p className="text-xs text-muted">Lv.{player.level}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted">
            {searchQuery ? "No players match your search." : "No players yet. Be the first to join!"}
          </p>
        </div>
      )}
    </div>
  );
}
