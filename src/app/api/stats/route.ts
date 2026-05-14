import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { DailyChallenge } from "@/models/DailyChallenge";
import { UserProgress } from "@/models/UserProgress";

// Cache stats for 5 minutes to avoid hammering the DB on every page load
let cachedStats: { users: number; challenges: number; completionRate: number } | null = null;
let cachedAt = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  try {
    if (cachedStats && Date.now() - cachedAt < CACHE_TTL) {
      return NextResponse.json(cachedStats);
    }

    await connectDB();

    const [userCount, challengeDocs, totalCompleted, totalProgress] = await Promise.all([
      User.countDocuments(),
      DailyChallenge.countDocuments(),
      UserProgress.countDocuments({ completed: true }),
      UserProgress.countDocuments(),
    ]);

    const totalQuestions = challengeDocs * 5; // 5 challenges per day
    const completionRate = totalProgress > 0
      ? Math.round((totalCompleted / totalProgress) * 100)
      : 0;

    cachedStats = {
      users: userCount,
      challenges: totalQuestions,
      completionRate,
    };
    cachedAt = Date.now();

    return NextResponse.json(cachedStats);
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ users: 0, challenges: 0, completionRate: 0 });
  }
}
