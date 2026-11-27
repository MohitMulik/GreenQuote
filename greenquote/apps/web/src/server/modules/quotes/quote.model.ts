import mongoose, { Schema, Document } from "mongoose";
import { Currency, QuoteStatus, QuoteTier, LineItemType, RebateTiming } from "@greenquote/shared";

export interface IQuoteDocument extends Document {
  contractorId: string;
  advisorId: string;
  currency: Currency;
  status: QuoteStatus;
  version: number;
  homeowner: {
    fullName: string;
    phone: string;
    email: string;
  };
  property: {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    existingHeatingFuel: string;
    electricUtility?: string;
  };
  options: Array<{
    tier: QuoteTier;
    title: string;
    description?: string;
    priceMinor: number;
    lineItems: Array<{
      type: LineItemType;
      label: string;
      amountMinor: number;
      equipmentId?: string;
    }>;
    incentives: Array<{
      programmeId: string;
      name: string;
      amountMinor: number;
      paid: RebateTiming;
      conditions: string;
    }>;
    estimatedSavings: {
      minAnnualMinor: number;
      maxAnnualMinor: number;
      assumptions: string;
    };
    exampleEmi: {
      ratePct: number;
      termMonths: number;
      downPaymentMinor: number;
      emiMinor: number;
      aprPct: number;
    };
  }>;
  linkToken: string;
  linkExpiresAt: Date;
  otpHash?: string;
  otpExpiresAt?: Date;
  smsConsentRecorded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuoteSchema = new Schema<IQuoteDocument>(
  {
    contractorId: { type: String, required: true, index: true },
    advisorId: { type: String, required: true, index: true },
    currency: { type: String, enum: ["INR", "USD"], default: "INR" },
    status: {
      type: String,
      enum: ["draft", "sent", "viewed", "prequalified", "no_offers", "signed", "installing", "installed", "funded", "cancelled"],
      default: "draft",
      index: true,
    },
    version: { type: Number, default: 1 },
    homeowner: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
    property: {
      streetAddress: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      existingHeatingFuel: { type: String, default: "natural_gas" },
      electricUtility: String,
    },
    options: [
      {
        tier: { type: String, enum: ["good", "better", "best"], required: true },
        title: { type: String, required: true },
        description: String,
        priceMinor: { type: Number, required: true },
        lineItems: [
          {
            type: { type: String, enum: ["equipment", "labour", "electrical", "permits", "other"], required: true },
            label: { type: String, required: true },
            amountMinor: { type: Number, required: true },
            equipmentId: String,
          },
        ],
        incentives: [
          {
            programmeId: String,
            name: String,
            amountMinor: Number,
            paid: { type: String, enum: ["instant", "after_installation"] },
            conditions: String,
          },
        ],
        estimatedSavings: {
          minAnnualMinor: Number,
          maxAnnualMinor: Number,
          assumptions: String,
        },
        exampleEmi: {
          ratePct: Number,
          termMonths: Number,
          downPaymentMinor: Number,
          emiMinor: Number,
          aprPct: Number,
        },
      },
    ],
    linkToken: { type: String, required: true, unique: true, index: true },
    linkExpiresAt: { type: Date, required: true },
    otpHash: String,
    otpExpiresAt: Date,
    smsConsentRecorded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const QuoteModel =
  mongoose.models.Quote || mongoose.model<IQuoteDocument>("Quote", QuoteSchema);
