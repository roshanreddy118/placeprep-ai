import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export const PLANS = {
  monthly: {
    name: "PlacePrep Pro",
    price: 500, // $5.00 in cents
    interval: "month" as const,
    features: [
      "5 AI-powered daily challenges",
      "LeetCode-style coding problems with code editor",
      "Adaptive difficulty based on your performance",
      "Detailed explanations & hints",
      "Streak tracking & XP system",
      "Leaderboard access",
      "Progress analytics & skill breakdown",
      "Badge collection",
      "Full challenge history",
      "Industry updates aligned with current trends",
    ],
  },
  trial: {
    name: "Free Trial",
    price: 0,
    duration: 7, // days
    features: [
      "Full access to all features for 7 days",
      "No credit card required",
      "Cancel anytime",
    ],
  },
};
