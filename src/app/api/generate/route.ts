import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { DailyChallenge, IChallengeItem } from "@/models/DailyChallenge";
import { User } from "@/models/User";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function getTodayStr() {
  // Use IST (UTC+5:30) so the date flips at midnight India time
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  return ist.toISOString().split("T")[0];
}

type DifficultyTier = "easy" | "medium" | "hard";

function getUserDifficulty(level: number, totalCorrect: number, totalAttempted: number): DifficultyTier {
  const accuracy = totalAttempted > 0 ? totalCorrect / totalAttempted : 0;

  // Level 1-3 OR accuracy < 40% → easy
  if (level <= 3 || (totalAttempted >= 5 && accuracy < 0.4)) return "easy";
  // Level 4-7 AND accuracy 40-70% → medium
  if (level <= 7 || (totalAttempted >= 5 && accuracy < 0.7)) return "medium";
  // Level 8+ AND accuracy >= 70% → hard
  return "hard";
}

const DIFFICULTY_CONFIG: Record<DifficultyTier, { codingLevel: string; mcqLevel: string; timeEstimate: string; xpMultiplier: number }> = {
  easy: {
    codingLevel: "LeetCode Easy — basic arrays, strings, simple loops, hash maps",
    mcqLevel: "straightforward, foundational concepts",
    timeEstimate: "10-15 minutes",
    xpMultiplier: 1,
  },
  medium: {
    codingLevel: "LeetCode Easy-Medium — two pointers, sliding window, basic recursion, stacks/queues",
    mcqLevel: "moderate, requiring deeper analysis and reasoning",
    timeEstimate: "15-20 minutes",
    xpMultiplier: 1.5,
  },
  hard: {
    codingLevel: "LeetCode Medium — BFS/DFS, dynamic programming, greedy algorithms, trees, graphs",
    mcqLevel: "challenging, testing advanced concepts and edge cases",
    timeEstimate: "20-30 minutes",
    xpMultiplier: 2,
  },
};

function buildPrompt(difficulty: DifficultyTier, recentTopics?: string): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const todayStr = getTodayStr();
  const config = DIFFICULTY_CONFIG[difficulty];
  const baseXP = { aptitude: 20, coding: 30, interview: 20, communication: 15, industry: 15 };
  const xp = (base: number) => Math.round(base * config.xpMultiplier);

  return `You are an AI placement coach. Generate 5 daily placement preparation challenges for ${today}.

DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
- Coding: ${config.codingLevel}
- MCQs: ${config.mcqLevel}
- The coding problem should be solvable in ${config.timeEstimate}

Return a valid JSON object with this exact structure:
{
  "date": "${todayStr}",
  "challenges": [
    {
      "id": "aptitude",
      "category": "Aptitude Question",
      "question": "A clear aptitude question testing logical/quantitative reasoning",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Detailed step-by-step explanation",
      "hint": "A helpful hint without giving away the answer",
      "difficulty": "${difficulty}",
      "xp": ${xp(baseXP.aptitude)}
    },
    {
      "id": "coding",
      "category": "Coding Problem",
      "question": "",
      "options": [],
      "correct": 0,
      "explanation": "Explain the optimal approach, time/space complexity",
      "hint": "A hint about the right data structure or technique",
      "difficulty": "${difficulty}",
      "xp": ${xp(baseXP.coding)},
      "coding": {
        "title": "Problem Title (like LeetCode)",
        "description": "Full problem description. Be very specific about input format, output format, and what the function should return. Use clear, precise language.",
        "examples": [
          {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "nums[0] + nums[1] = 2 + 7 = 9"},
          {"input": "nums = [3,2,4], target = 6", "output": "[1,2]", "explanation": "nums[1] + nums[2] = 2 + 4 = 6"}
        ],
        "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
        "starterCode": {
          "python": "def solution(nums, target):\\n    # Write your solution here\\n    pass",
          "javascript": "function solution(nums, target) {\\n    // Write your solution here\\n}"
        },
        "testCases": [
          {"input": "[[2,7,11,15], 9]", "expected": "[0, 1]"},
          {"input": "[[3,2,4], 6]", "expected": "[1, 2]"},
          {"input": "[[3,3], 6]", "expected": "[0, 1]", "hidden": true},
          {"input": "[[1,5,8,3], 11]", "expected": "[1, 3]", "hidden": true}
        ]
      }
    },
    {
      "id": "interview",
      "category": "Interview Question",
      "question": "A common behavioral or technical interview question with context on how to approach it",
      "options": ["Best approach", "Decent approach", "Poor approach", "Worst approach"],
      "correct": 0,
      "explanation": "Why this approach works best and how to structure the answer",
      "hint": "A tip about what interviewers are really looking for",
      "difficulty": "${difficulty}",
      "xp": ${xp(baseXP.interview)}
    },
    {
      "id": "communication",
      "category": "Communication Tip",
      "question": "A workplace communication scenario with a question about the best approach",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 1,
      "explanation": "Why this communication approach is most effective",
      "hint": "Think about the audience and context",
      "difficulty": "${difficulty}",
      "xp": ${xp(baseXP.communication)}
    },
    {
      "id": "industry",
      "category": "Industry Update",
      "question": "A question about current tech industry trends, hiring patterns, or technology developments as of ${today}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 1,
      "explanation": "Detailed explanation with current context",
      "hint": "Think about recent developments in the tech industry",
      "difficulty": "${difficulty}",
      "xp": ${xp(baseXP.industry)}
    }
  ]
}

IMPORTANT RULES FOR THE CODING PROBLEM:
- It must be a LeetCode-style problem (not an MCQ)
- Difficulty MUST match ${difficulty.toUpperCase()} level: ${config.codingLevel}
- The function name in starterCode MUST be "solution" for both Python and JavaScript
- testCases input must be a JSON array of arguments that get passed to the function (e.g., "[[2,7,11,15], 9]" means two args: array and number)
- testCases expected must be the JSON representation of the expected return value
- Include at least 4 test cases, with 2 visible and 2 hidden
- Make absolutely sure the test cases are CORRECT — verify each expected output manually
- The problem should be solvable in ${config.timeEstimate}
- Reflect what top tech companies (Google, Amazon, Microsoft) currently ask

Other rules:
- Questions must be unique and different each day
- Industry updates should reflect real current trends as of ${today}
- All explanations must be educational and detailed
- Return ONLY the JSON, no markdown formatting or code blocks
${recentTopics ? `\nCRITICAL — DO NOT repeat these recently used topics/questions:\n- ${recentTopics}\nGenerate completely different questions on new topics.` : ""}`;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit per user
    const userId = (session.user as { id: string }).id;
    const { success } = rateLimit(`generate:${userId}`, { maxRequests: 10, windowMs: 60 * 1000 });
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Get user for personalized difficulty
    let difficulty: DifficultyTier = "easy";
    const user = await User.findById(userId).lean();
    if (user) {
      difficulty = getUserDifficulty(user.level, user.totalCorrect, user.totalAttempted);
    }

    // Check if today's challenge for this difficulty already exists
    const todayStr = getTodayStr();
    const cacheKey = `${todayStr}_${difficulty}`;
    const existing = await DailyChallenge.findOne({ date: cacheKey });
    if (existing) {
      return NextResponse.json({ ...existing.toObject(), date: todayStr, difficulty });
    }

    // Fetch recent challenge topics to avoid repetition
    const recentChallenges = await DailyChallenge.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    const recentTopics = recentChallenges
      .flatMap((c) => c.challenges.map((ch: IChallengeItem) => {
        if (ch.coding) return `Coding: ${ch.coding.title}`;
        return `${ch.category}: ${ch.question.slice(0, 80)}`;
      }))
      .join("\n- ");

    // Generate new challenges via AI with fallback chain: Gemini → Groq → OpenRouter
    const prompt = buildPrompt(difficulty, recentTopics);
    let text: string | null = null;

    // 1. Try Gemini
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      text = result.response.text();
    } catch (geminiErr) {
      console.warn("Gemini failed, trying Groq:", (geminiErr as Error).message);
    }

    // 2. Fallback: Groq
    if (!text && process.env.GROQ_API_KEY) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 4096,
          }),
          cache: "no-store",
        });
        if (!groqRes.ok) throw new Error(`Groq ${groqRes.status}: ${await groqRes.text()}`);
        const groqData = await groqRes.json();
        text = groqData.choices?.[0]?.message?.content || null;

      } catch (groqErr) {
        console.warn("Groq failed, trying OpenRouter:", (groqErr as Error).message);
      }
    }

    // 3. Fallback: OpenRouter
    if (!text && process.env.OPENROUTER_API_KEY) {
      try {
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.3-70b-instruct",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 4096,
          }),
          cache: "no-store",
        });
        if (!orRes.ok) throw new Error(`OpenRouter ${orRes.status}: ${await orRes.text()}`);
        const orData = await orRes.json();
        text = orData.choices?.[0]?.message?.content || null;

      } catch (orErr) {
        console.warn("OpenRouter failed:", (orErr as Error).message);
      }
    }

    if (!text) {
      throw new Error("All AI providers failed");
    }

    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const data = JSON.parse(cleaned);

    // Save to MongoDB keyed by date + difficulty
    const saved = await DailyChallenge.create({
      date: cacheKey,
      challenges: data.challenges,
    });

    return NextResponse.json({ ...saved.toObject(), date: todayStr, difficulty });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(getFallbackChallenge(), { status: 200 });
  }
}

function getFallbackChallenge() {
  return {
    date: getTodayStr(),
    challenges: [
      {
        id: "aptitude",
        category: "Aptitude Question",
        question:
          "A train travels 360 km in 4 hours. If it increases speed by 30 km/hr, how long will it take?",
        options: ["2 hours 40 min", "3 hours", "2 hours", "3 hours 20 min"],
        correct: 1,
        explanation:
          "Original speed = 360/4 = 90 km/hr. New speed = 120 km/hr. Time = 360/120 = 3 hours.",
        hint: "Calculate original speed first, then add the increase.",
        difficulty: "medium",
        xp: 20,
      },
      {
        id: "coding",
        category: "Coding Problem",
        question: "",
        options: [],
        correct: 0,
        explanation:
          "Use a HashMap to store complement values. For each number, check if target - num exists in the map. O(n) time, O(n) space.",
        hint: "Can you use a hash map to avoid the brute force O(n²) approach?",
        difficulty: "medium",
        xp: 30,
        coding: {
          title: "Two Sum",
          description:
            "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nReturn the answer as an array of two indices, sorted in ascending order.",
          examples: [
            {
              input: "nums = [2,7,11,15], target = 9",
              output: "[0, 1]",
              explanation: "nums[0] + nums[1] = 2 + 7 = 9",
            },
            {
              input: "nums = [3,2,4], target = 6",
              output: "[1, 2]",
              explanation: "nums[1] + nums[2] = 2 + 4 = 6",
            },
          ],
          constraints: [
            "2 <= nums.length <= 10^4",
            "-10^9 <= nums[i] <= 10^9",
            "Only one valid answer exists",
          ],
          starterCode: {
            python:
              "def solution(nums, target):\n    # Write your solution here\n    pass",
            javascript:
              "function solution(nums, target) {\n    // Write your solution here\n}",
          },
          testCases: [
            { input: "[[2,7,11,15], 9]", expected: "[0, 1]" },
            { input: "[[3,2,4], 6]", expected: "[1, 2]" },
            { input: "[[3,3], 6]", expected: "[0, 1]", hidden: true },
            { input: "[[1,5,8,3], 11]", expected: "[1, 3]", hidden: true },
          ],
        },
      },
      {
        id: "interview",
        category: "Interview Question",
        question:
          '"What is your greatest weakness?" — How should you answer this in a tech interview?',
        options: [
          "Share a genuine weakness and what you're doing to improve it",
          "Say you have no weaknesses",
          'Turn a strength into a weakness (e.g., "I work too hard")',
          "Avoid the question entirely",
        ],
        correct: 0,
        explanation:
          "Be authentic. Share a real weakness, show self-awareness, and explain concrete steps you're taking to improve. This shows growth mindset and honesty.",
        hint: "Interviewers value self-awareness and growth mindset over perfection.",
        difficulty: "medium",
        xp: 20,
      },
      {
        id: "communication",
        category: "Communication Tip",
        question:
          "During a team meeting, a colleague dismisses your idea. What's the best response?",
        options: [
          "Argue aggressively to defend your idea",
          "Stay silent and never bring it up again",
          "Acknowledge their perspective, ask clarifying questions, then present supporting data",
          "Complain to the manager after the meeting",
        ],
        correct: 2,
        explanation:
          "Professional communication means staying composed, showing you value others' input, and backing your ideas with evidence.",
        hint: "The best communicators listen first and respond with data.",
        difficulty: "easy",
        xp: 15,
      },
      {
        id: "industry",
        category: "Industry Update",
        question:
          "Which is a major trend in tech hiring for 2026?",
        options: [
          "Companies only hire from IITs",
          "AI/ML skills are in high demand across all tech roles",
          "Web development is no longer relevant",
          "Remote work has been completely eliminated",
        ],
        correct: 1,
        explanation:
          "AI/ML skills are increasingly expected across all roles. Companies want developers who can integrate AI tools into workflows and build AI-powered features.",
        hint: "Think about how AI is changing every aspect of tech work.",
        difficulty: "easy",
        xp: 15,
      },
    ],
  };
}
