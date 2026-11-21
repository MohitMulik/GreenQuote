import mongoose, { Schema, Document } from "mongoose";

export interface IIncentiveProgramDocument extends Document {
  name: string;
  authorityType: "federal" | "state" | "utility" | "municipal";
  state: string; // 2-letter state code or 'IN' for national Indian program
  utilityProvider?: string;
  rules: {
    equipmentCategories: string[];
    minSeer2?: number;
    minHspf2?: number;
    requireColdClimate?: boolean;
    incomeQualifiedMaxAmiPct?: number;
  };
  amountStructure: {
    type: "fixed" | "percentage";
    valueMinor: number;
    maxCapMinor?: number;
  };
  paymentTiming: "instant" | "after_installation";
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  version: number;
}

const IncentiveProgramSchema = new Schema<IIncentiveProgramDocument>(
  {
    name: { type: String, required: true },
    authorityType: { type: String, required: true },
    state: { type: String, required: true, index: true },
    utilityProvider: { type: String, index: true },
    rules: {
      equipmentCategories: [{ type: String }],
      minSeer2: Number,
      minHspf2: Number,
      requireColdClimate: Boolean,
      incomeQualifiedMaxAmiPct: Number,
    },
    amountStructure: {
      type: { type: String, enum: ["fixed", "percentage"], required: true },
      valueMinor: { type: Number, required: true },
      maxCapMinor: Number,
    },
    paymentTiming: {
      type: String,
      enum: ["instant", "after_installation"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: Date,
    isActive: { type: Boolean, default: true, index: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const IncentiveProgramModel = mongoose.model<IIncentiveProgramDocument>(
  "IncentiveProgram",
  IncentiveProgramSchema
);
