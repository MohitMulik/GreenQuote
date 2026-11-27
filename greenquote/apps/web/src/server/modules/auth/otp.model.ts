import mongoose, { Schema, Document } from "mongoose";

export interface IOtpChallengeDocument extends Document {
  quoteToken: string;
  quoteId: string;
  channel: "sms" | "email";
  codeHash: string;
  expiresAt: Date;
  consumedAt?: Date;
  attemptCount: number;
  createdAt: Date;
}

const OtpChallengeSchema = new Schema<IOtpChallengeDocument>(
  {
    quoteToken: { type: String, required: true, index: true },
    quoteId: { type: String, required: true },
    channel: { type: String, enum: ["sms", "email"], required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date },
    attemptCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const OtpChallengeModel =
  mongoose.models.OtpChallenge ||
  mongoose.model<IOtpChallengeDocument>(
    "OtpChallenge",
    OtpChallengeSchema
  );
