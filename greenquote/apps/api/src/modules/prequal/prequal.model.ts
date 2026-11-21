import mongoose, { Schema, Document } from "mongoose";
import { QuoteTier } from "@greenquote/shared";

export interface IPrequalificationDocument extends Document {
  quoteId: string;
  selectedTier: QuoteTier;
  amountRequestedMinor: number;
  downPaymentMinor: number;
  applicant: {
    dateOfBirthEncrypted: string;
    annualIncomeEncrypted: string;
    housingPaymentEncrypted: string;
    ssnLastFourEncrypted: string;
  };
  consent: {
    softPullAgreed: boolean;
    tcpaAgreed: boolean;
    consentVersion: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
  };
  status: "pending" | "offers_ready" | "all_declined" | "expired";
  idempotencyKey: string;
  createdAt: Date;
}

const PrequalificationSchema = new Schema<IPrequalificationDocument>(
  {
    quoteId: { type: String, required: true, index: true },
    selectedTier: { type: String, enum: ["good", "better", "best"], required: true },
    amountRequestedMinor: { type: Number, required: true },
    downPaymentMinor: { type: Number, default: 0 },
    applicant: {
      dateOfBirthEncrypted: { type: String, required: true },
      annualIncomeEncrypted: { type: String, required: true },
      housingPaymentEncrypted: { type: String, required: true },
      ssnLastFourEncrypted: { type: String, required: true },
    },
    consent: {
      softPullAgreed: { type: Boolean, required: true },
      tcpaAgreed: { type: Boolean, default: true },
      consentVersion: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      ipAddress: String,
      userAgent: String,
    },
    status: {
      type: String,
      enum: ["pending", "offers_ready", "all_declined", "expired"],
      default: "pending",
    },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

export const PrequalificationModel = mongoose.model<IPrequalificationDocument>(
  "Prequalification",
  PrequalificationSchema
);
