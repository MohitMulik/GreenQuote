import mongoose, { Schema, Document } from "mongoose";

export interface IHomeownerDocument extends Document {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirthEncrypted?: string;
  ssnLastFourEncrypted?: string;
  annualIncomeEncrypted?: string;
  housingPaymentEncrypted?: string;
  consentRecords: Array<{
    type: "tcpa_sms" | "fcra_soft_pull" | "hard_pull_ack" | "esign_consent";
    version: string;
    consentText: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const HomeownerSchema = new Schema<IHomeownerDocument>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, index: true },
    dateOfBirthEncrypted: { type: String },
    ssnLastFourEncrypted: { type: String },
    annualIncomeEncrypted: { type: String },
    housingPaymentEncrypted: { type: String },
    consentRecords: [
      {
        type: String,
        version: String,
        consentText: String,
        timestamp: Date,
        ipAddress: String,
        userAgent: String,
      },
    ],
  },
  { timestamps: true }
);

export const HomeownerModel = mongoose.model<IHomeownerDocument>("Homeowner", HomeownerSchema);
