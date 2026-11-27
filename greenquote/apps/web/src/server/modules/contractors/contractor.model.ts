import mongoose, { Schema, Document } from "mongoose";

export interface IContractorDocument extends Document {
  legalName: string;
  tradeName?: string;
  einHash: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    isPoBox: boolean;
  };
  ownerDetails: {
    fullName: string;
    email: string;
    phone: string;
  };
  tradeCategories: string[];
  kybStatus: "pending" | "passed" | "failed" | "manual_review";
  licenses: Array<{
    state: string;
    licenseNumber: string;
    expiresAt: Date;
    documentUrl: string;
    verified: boolean;
  }>;
  insurance: {
    provider: string;
    policyNumber: string;
    coverageAmountMinor: number;
    expiresAt: Date;
    documentUrl: string;
    verified: boolean;
  };
  payoutAccount?: {
    accountToken: string;
    bankName: string;
    lastFour: string;
    accountHolderName: string;
    verifiedAt: Date;
  };
  platformAgreement: {
    version: string;
    acceptedAt: Date;
    ipAddress: string;
  };
  status: "pending_review" | "active" | "suspended" | "rejected";
  plan: "starter" | "pro" | "team";
  createdAt: Date;
  updatedAt: Date;
}

const ContractorSchema = new Schema<IContractorDocument>(
  {
    legalName: { type: String, required: true },
    tradeName: { type: String },
    einHash: { type: String, required: true, index: true },
    businessAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      isPoBox: { type: Boolean, default: false },
    },
    ownerDetails: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    tradeCategories: [{ type: String }],
    kybStatus: {
      type: String,
      enum: ["pending", "passed", "failed", "manual_review"],
      default: "pending",
    },
    licenses: [
      {
        state: String,
        licenseNumber: String,
        expiresAt: Date,
        documentUrl: String,
        verified: { type: Boolean, default: false },
      },
    ],
    insurance: {
      provider: String,
      policyNumber: String,
      coverageAmountMinor: Number,
      expiresAt: Date,
      documentUrl: String,
      verified: { type: Boolean, default: false },
    },
    payoutAccount: {
      accountToken: String,
      bankName: String,
      lastFour: String,
      accountHolderName: String,
      verifiedAt: Date,
    },
    platformAgreement: {
      version: { type: String, default: "1.0" },
      acceptedAt: { type: Date, default: Date.now },
      ipAddress: { type: String, default: "127.0.0.1" },
    },
    status: {
      type: String,
      enum: ["pending_review", "active", "suspended", "rejected"],
      default: "pending_review",
    },
    plan: {
      type: String,
      enum: ["starter", "pro", "team"],
      default: "starter",
    },
  },
  { timestamps: true }
);

export const ContractorModel =
  mongoose.models.Contractor ||
  mongoose.model<IContractorDocument>("Contractor", ContractorSchema);
