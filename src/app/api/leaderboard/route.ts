import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET() {
  try {
    await connectDB();

    const users = await User.find()
      .select("name college xp level streak")
      .sort({ xp: -1 })
      .limit(50)
      .lean();

    const leaderboard = users.map((user, i) => ({
      rank: i + 1,
      name: user.name,
      college: user.college,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      avatar: user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
