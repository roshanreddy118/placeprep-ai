import mongoose, { Schema, models, model } from "mongoose";

export interface IPasswordReset {
  email: string;
  tokenHash: string;
  expiresAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    email: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-delete expired tokens
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordReset =
  models.PasswordReset ||
  model<IPasswordReset>("PasswordReset", PasswordResetSchema);
