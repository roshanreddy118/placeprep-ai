import mongoose, { Schema, models, model } from "mongoose";

export interface IChallengeResult {
  challengeId: string;
  category: string;
  correct: boolean;
  xpEarned: number;
  answer?: string; // MCQ selected option or code submitted
}

export interface IUserProgress {
  userId: string;
  date: string;
  completed: boolean;
  results: IChallengeResult[];
  totalXP: number;
  completedAt?: Date;
}

const ChallengeResultSchema = new Schema<IChallengeResult>({
  challengeId: { type: String, required: true },
  category: { type: String, required: true },
  correct: { type: Boolean, required: true },
  xpEarned: { type: Number, default: 0 },
  answer: String,
});

const UserProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    completed: { type: Boolean, default: false },
    results: [ChallengeResultSchema],
    totalXP: { type: Number, default: 0 },
    completedAt: Date,
  },
  { timestamps: true }
);

UserProgressSchema.index({ userId: 1, date: 1 }, { unique: true });

export const UserProgress =
  models.UserProgress ||
  model<IUserProgress>("UserProgress", UserProgressSchema);
