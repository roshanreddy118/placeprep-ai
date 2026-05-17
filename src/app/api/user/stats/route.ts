import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { UserProgress } from "@/models/UserProgress";

function getISTDate(offsetDays = 0) {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  if (offsetDays) ist.setDate(ist.getDate() + offsetDays);
  return ist;
}

function getISTDateStr(offsetDays = 0) {
  return getISTDate(offsetDays).toISOString().split("T")[0];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userId = (session.user as { id: string }).id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get today's progress
    const today = getISTDateStr();
    const todayProgress = await UserProgress.findOne({ userId, date: today });

    // Get rank
    const rank = await User.countDocuments({ xp: { $gt: user.xp } }) + 1;

    // Get accuracy
    const accuracy =
      user.totalAttempted > 0
        ? Math.round((user.totalCorrect / user.totalAttempted) * 100)
        : 0;

    // Get this week's activity — compute using date strings to avoid IST offset issues
    const istNow = getISTDate();
    const dayOfWeek = (istNow.getDay() + 6) % 7; // 0=Mon, 6=Sun
    const startOfWeekStr = getISTDateStr(-dayOfWeek);

    const weekProgress = await UserProgress.find({
      userId,
      date: {
        $gte: startOfWeekStr,
        $lte: today,
      },
    }).select("date completed");

    const weekDates = new Set(weekProgress.filter((p) => p.completed).map((p) => p.date));
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekActivity = days.map((day, i) => {
      const dateStr = getISTDateStr(-dayOfWeek + i);
      return { day, completed: weekDates.has(dateStr) };
    });

    // Get last 28 days of activity for heatmap
    const fourWeeksAgoStr = getISTDateStr(-27);

    const recentProgress = await UserProgress.find({
      userId,
      date: { $gte: fourWeeksAgoStr, $lte: today },
      completed: true,
    }).select("date totalXP").lean();

    const activeDays: Record<string, number> = {};
    for (const p of recentProgress) {
      activeDays[p.date] = p.totalXP;
    }

    // XP for current level
    const xpPerLevel = 500;
    const currentLevelXP = user.xp % xpPerLevel;

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        college: user.college,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        bestStreak: user.bestStreak,
        totalDaysActive: user.totalDaysActive,
        totalCorrect: user.totalCorrect,
        totalAttempted: user.totalAttempted,
        badges: user.badges,
        createdAt: user.createdAt,
      },
      rank,
      accuracy,
      todayProgress: todayProgress
        ? {
            completed: todayProgress.completed,
            results: todayProgress.results,
            totalXP: todayProgress.totalXP,
          }
        : null,
      weekActivity,
      activeDays,
      currentLevelXP,
      xpPerLevel,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
