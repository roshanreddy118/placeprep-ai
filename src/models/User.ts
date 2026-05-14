import mongoose, { Schema, models, model } from "mongoose";

export type SubscriptionStatus = "trial" | "active" | "expired" | "cancelled";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  college: string;
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  totalDaysActive: number;
  totalCorrect: number;
  totalAttempted: number;
  badges: string[];
  // Subscription
  subscription: SubscriptionStatus;
  trialEndsAt: Date;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionEndsAt: Date | null;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    college: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: null },
    totalDaysActive: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalAttempted: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    // Subscription
    subscription: {
      type: String,
      enum: ["trial", "active", "expired", "cancelled"],
      default: "trial",
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    subscriptionEndsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);
