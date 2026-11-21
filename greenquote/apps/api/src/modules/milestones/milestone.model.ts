import mongoose, { Schema, Document } from "mongoose";
import { MilestoneType } from "@greenquote/shared";

export interface IMilestoneDocument extends Document {
  loanId: string;
  contractorId: string;
  homeownerId: string;
  type: MilestoneType;
  amountMinor: number;
  status: "pending" | "submitted" | "confirmed_by_homeowner" | "payout_released" | "held";
  evidenceUrls?: string[];
  equipmentVerified: boolean;
  homeownerConfirmedAt?: Date;
  payoutReleasedAt?: Date;
  holdReason?: string;
  rescissionPeriodEndsAt?: Date;
  rescissionStatus?: "active" | "expired" | "rescinded";
  rescindedAt?: Date;
  rescindReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestoneDocument>(
  {
    loanId: { type: String, required: true, index: true },
    contractorId: { type: String, required: true, index: true },
    homeownerId: { type: String, required: true },
    type: { type: String, enum: ["approval_draw", "final_completion"], required: true },
    amountMinor: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "submitted", "confirmed_by_homeowner", "payout_released", "held"],
      default: "pending",
      index: true,
    },
    evidenceUrls: [{ type: String }],
    equipmentVerified: { type: Boolean, default: false },
    homeownerConfirmedAt: Date,
    payoutReleasedAt: Date,
    holdReason: String,
    rescissionPeriodEndsAt: Date,
    rescissionStatus: {
      type: String,
      enum: ["active", "expired", "rescinded"],
      default: "active",
    },
    rescindedAt: Date,
    rescindReason: String,
  },
  { timestamps: true }
);

export const MilestoneModel = mongoose.model<IMilestoneDocument>("Milestone", MilestoneSchema);
