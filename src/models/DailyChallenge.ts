import mongoose, { Schema, models, model } from "mongoose";

export interface ITestCase {
  input: string;
  expected: string;
  hidden?: boolean;
}

export interface ICodingChallenge {
  title: string;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  starterCode: { python: string; javascript: string };
  testCases: ITestCase[];
}

export interface IChallengeItem {
  id: string;
  category: string;
  question: string;
  options?: string[];
  correct?: number;
  explanation: string;
  hint: string;
  difficulty: string;
  xp: number;
  coding?: ICodingChallenge;
}

export interface IDailyChallenge {
  date: string;
  challenges: IChallengeItem[];
  createdAt: Date;
}

const TestCaseSchema = new Schema<ITestCase>({
  input: { type: String, required: true },
  expected: { type: String, required: true },
  hidden: { type: Boolean, default: false },
});

const CodingChallengeSchema = new Schema<ICodingChallenge>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  examples: [
    {
      input: String,
      output: String,
      explanation: String,
    },
  ],
  constraints: [String],
  starterCode: {
    python: String,
    javascript: String,
  },
  testCases: [TestCaseSchema],
});

const ChallengeItemSchema = new Schema<IChallengeItem>({
  id: { type: String, required: true },
  category: { type: String, required: true },
  question: { type: String, default: "" },
  options: [String],
  correct: Number,
  explanation: { type: String, required: true },
  hint: { type: String, required: true },
  difficulty: { type: String, required: true },
  xp: { type: Number, required: true },
  coding: CodingChallengeSchema,
});

const DailyChallengeSchema = new Schema<IDailyChallenge>(
  {
    date: { type: String, required: true, unique: true },
    challenges: [ChallengeItemSchema],
  },
  { timestamps: true }
);

export const DailyChallenge =
  models.DailyChallenge ||
  model<IDailyChallenge>("DailyChallenge", DailyChallengeSchema);
