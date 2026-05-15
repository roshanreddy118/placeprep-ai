import mongoose, { Schema, models, model } from "mongoose";

export interface IEmailVerification {
  email: string;
  token: string;
  expiresAt: Date;
}

const EmailVerificationSchema = new Schema<IEmailVerification>(
  {
    email: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-delete expired tokens
EmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailVerification =
  models.EmailVerification ||
  model<IEmailVerification>("EmailVerification", EmailVerificationSchema);
