import mongoose, { Schema, Document } from "mongoose";

export interface IOfferDocument extends Document {
  prequalificationId: string;
  lenderId: string;
  lenderName: string;
  aprPct: number;
  termMonths: number;
  monthlyPaymentMinor: number;
  amountFinancedMinor: number;
  totalCostOfCreditMinor: number;
  contractorBuyDownMinor: number;
  status: "active" | "selected" | "expired" | "declined";
  declineReasons?: string[];
  expiresAt: Date;
  createdAt: Date;
}

const OfferSchema = new Schema<IOfferDocument>(
  {
    prequalificationId: { type: String, required: true, index: true },
    lenderId: { type: String, required: true, index: true },
    lenderName: { type: String, required: true },
    aprPct: { type: Number, required: true },
    termMonths: { type: Number, required: true },
    monthlyPaymentMinor: { type: Number, required: true },
    amountFinancedMinor: { type: Number, required: true },
    totalCostOfCreditMinor: { type: Number, required: true },
    contractorBuyDownMinor: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "selected", "expired", "declined"],
      default: "active",
      index: true,
    },
    declineReasons: [{ type: String }],
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const OfferModel = mongoose.model<IOfferDocument>("Offer", OfferSchema);
