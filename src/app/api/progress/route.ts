import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { UserProgress } from "@/models/UserProgress";

function getISTDateStr(offsetDays = 0) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  if (offsetDays) ist.setDate(ist.getDate() + offsetDays);
  return ist.toISOString().split("T")[0];
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userId = (session.user as { id: string }).id;
    const { results, totalXP } = await req.json();

    if (!results || !Array.isArray(results)) {
      return NextResponse.json({ error: "Invalid results" }, { status: 400 });
    }

    const today = getISTDateStr();

    // Check if already submitted today
    const existing = await UserProgress.findOne({ userId, date: today });
    if (existing) {
      return NextResponse.json(
        { error: "Already submitted today", progress: existing },
        { status: 409 }
      );
    }

    const correctCount = results.filter(
      (r: { correct: boolean }) => r.correct
    ).length;
    const allCorrect = correctCount === results.length;

    // Save progress
    const progress = await UserProgress.create({
      userId,
      date: today,
      completed: true,
      results,
      totalXP,
      completedAt: new Date(),
    });

    // Update user stats
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update streak
    const yesterdayStr = getISTDateStr(-1);

    let newStreak = 1;
    if (user.lastActiveDate === yesterdayStr) {
      newStreak = user.streak + 1;
    } else if (user.lastActiveDate === today) {
      newStreak = user.streak; // already active today
    }

    const newBestStreak = Math.max(user.bestStreak, newStreak);

    // Check for badge unlocks
    const newBadges = [...user.badges];
    if (!newBadges.includes("first-day")) {
      newBadges.push("first-day");
    }
    if (newStreak >= 3 && !newBadges.includes("three-streak")) {
      newBadges.push("three-streak");
    }
    if (newStreak >= 7 && !newBadges.includes("week-streak")) {
      newBadges.push("week-streak");
    }
    if (newStreak >= 30 && !newBadges.includes("month-streak")) {
      newBadges.push("month-streak");
    }
    if (allCorrect && !newBadges.includes("perfect-day")) {
      newBadges.push("perfect-day");
    }
    const newTotalDaysActive = user.totalDaysActive + (user.lastActiveDate === today ? 0 : 1);
    if (newTotalDaysActive >= 10 && !newBadges.includes("ten-days")) {
      newBadges.push("ten-days");
    }
    if (newTotalDaysActive >= 50 && !newBadges.includes("fifty-days")) {
      newBadges.push("fifty-days");
    }

    const newXP = user.xp + totalXP;
    const newLevel = Math.floor(newXP / 500) + 1;

    if (newLevel >= 5 && !newBadges.includes("level-5")) {
      newBadges.push("level-5");
    }
    if (newLevel >= 10 && !newBadges.includes("level-10")) {
      newBadges.push("level-10");
    }

    // Category-specific badges: count historical correct answers per category
    const categoryAgg = await UserProgress.aggregate([
      { $match: { userId } },
      { $unwind: "$results" },
      { $match: { "results.correct": true } },
      { $group: { _id: "$results.category", count: { $sum: 1 } } },
    ]);
    // Include current submission
    for (const r of results) {
      if (r.correct) {
        const existing = categoryAgg.find((a: { _id: string }) => a._id === r.category);
        if (existing) existing.count++;
        else categoryAgg.push({ _id: r.category, count: 1 });
      }
    }
    const categoryCount = (cat: string) => categoryAgg.find((a: { _id: string }) => a._id === cat)?.count || 0;
    if (categoryCount("coding") >= 10 && !newBadges.includes("code-ninja")) {
      newBadges.push("code-ninja");
    }
    if (categoryCount("aptitude") >= 10 && !newBadges.includes("aptitude-ace")) {
      newBadges.push("aptitude-ace");
    }
    if (categoryCount("interview") >= 10 && !newBadges.includes("interview-pro")) {
      newBadges.push("interview-pro");
    }

    await User.findByIdAndUpdate(userId, {
      xp: newXP,
      level: newLevel,
      streak: newStreak,
      bestStreak: newBestStreak,
      lastActiveDate: today,
      $inc: {
        totalDaysActive: user.lastActiveDate === today ? 0 : 1,
        totalCorrect: correctCount,
        totalAttempted: results.length,
      },
      badges: newBadges,
    });

    return NextResponse.json({
      success: true,
      progress,
      stats: {
        xp: newXP,
        level: newLevel,
        streak: newStreak,
        bestStreak: newBestStreak,
        newBadges: newBadges.filter((b) => !user.badges.includes(b)),
      },
    });
  } catch (error) {
    console.error("Progress save error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
