import mongoose, { Schema, models, model } from "mongoose";

export interface IFeedback {
  name: string;
  email: string;
  message: string;
  rating: number;
  approved: boolean;
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Feedback =
  models.Feedback || model<IFeedback>("Feedback", FeedbackSchema);
