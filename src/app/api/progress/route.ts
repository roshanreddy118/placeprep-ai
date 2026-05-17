import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { UserProgress } from "@/models/UserProgress";
import { DailyChallenge, IChallengeItem } from "@/models/DailyChallenge";

type DifficultyTier = "easy" | "medium" | "hard";

function getUserDifficulty(level: number, totalCorrect: number, totalAttempted: number): DifficultyTier {
  const accuracy = totalAttempted > 0 ? totalCorrect / totalAttempted : 0;
  if (level <= 3 || (totalAttempted >= 5 && accuracy < 0.4)) return "easy";
  if (level <= 7 || (totalAttempted >= 5 && accuracy < 0.7)) return "medium";
  return "hard";
}

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
    const { results } = await req.json();

    if (!results || !Array.isArray(results)) {
      return NextResponse.json({ error: "Invalid results" }, { status: 400 });
    }

    const today = getISTDateStr();

    // Look up the user to determine their difficulty tier
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch today's challenge to verify answers server-side
    const userDifficulty = getUserDifficulty(user.level, user.totalCorrect, user.totalAttempted);
    const cacheKey = `${today}_${userDifficulty}`;
    const dailyChallenge = await DailyChallenge.findOne({ date: cacheKey });

    // Server-side answer verification
    let verifiedCorrectCount = 0;
    let verifiedTotalXP = 0;
    const verifiedResults = results.map((r: { challengeId: string; category: string; answer?: string | number }) => {
      const challenge = dailyChallenge?.challenges.find((ch: IChallengeItem) => ch.id === r.challengeId);
      let correct = false;
      let xpEarned = 0;

      if (challenge) {
        // For MCQ challenges, verify the selected answer matches the correct option
        if (challenge.id !== "coding" && typeof r.answer === "number") {
          correct = r.answer === challenge.correct;
        }
        // For coding challenges, trust the client result (code ran in browser sandbox)
        if (challenge.id === "coding") {
          correct = r.answer === "passed";
        }
        xpEarned = correct ? challenge.xp : 0;
      }

      if (correct) verifiedCorrectCount++;
      verifiedTotalXP += xpEarned;

      return {
        challengeId: r.challengeId,
        category: r.category,
        correct,
        xpEarned,
        answer: r.answer,
      };
    });

    const allCorrect = verifiedCorrectCount === verifiedResults.length;

    // Use findOneAndUpdate with upsert to prevent race condition
    const existingProgress = await UserProgress.findOneAndUpdate(
      { userId, date: today },
      {
        $setOnInsert: {
          userId,
          date: today,
          completed: true,
          results: verifiedResults,
          totalXP: verifiedTotalXP,
          completedAt: new Date(),
        },
      },
      { upsert: true, new: true, rawResult: true }
    );

    // If the document already existed (not a new upsert), reject
    if (!existingProgress.lastErrorObject?.upserted) {
      return NextResponse.json(
        { error: "Already submitted today" },
        { status: 409 }
      );
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

    const newXP = user.xp + verifiedTotalXP;
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
    for (const r of verifiedResults) {
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
        totalCorrect: verifiedCorrectCount,
        totalAttempted: verifiedResults.length,
      },
      badges: newBadges,
    });

    return NextResponse.json({
      success: true,
      progress: existingProgress.value,
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
