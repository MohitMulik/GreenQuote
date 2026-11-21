import mongoose, { Schema } from "mongoose";

export interface IEsign {
  _id?: unknown;
  offerId: string;
  quoteId: string;
  contractorId: string;
  homeownerEmail: string;
  signatureDataUrl: string;
  signatureHash: string;
  tilaAcknowledged: boolean;
  esignConsentAgreed: boolean;
  signerIp: string;
  userAgent: string;
  signedAt: Date;
  status: "valid" | "revoked";
  tilaDisclosures: {
    aprPct: number;
    amountFinancedMinor: number;
    financeChargeMinor: number;
    totalOfPaymentsMinor: number;
    monthlyPaymentMinor: number;
    termMonths: number;
  };
  retentionYears: number;
}

const EsignSchema = new Schema<IEsign>(
  {
    offerId: { type: String, required: true, index: true },
    quoteId: { type: String, required: true, index: true },
    contractorId: { type: String, required: true, index: true },
    homeownerEmail: { type: String, required: true },
    signatureDataUrl: { type: String, required: true },
    signatureHash: { type: String, required: true },
    tilaAcknowledged: { type: Boolean, required: true, default: false },
    esignConsentAgreed: { type: Boolean, required: true, default: false },
    signerIp: { type: String, required: true },
    userAgent: { type: String, required: true },
    signedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["valid", "revoked"], default: "valid" },
    tilaDisclosures: {
      aprPct: { type: Number, required: true },
      amountFinancedMinor: { type: Number, required: true },
      financeChargeMinor: { type: Number, required: true },
      totalOfPaymentsMinor: { type: Number, required: true },
      monthlyPaymentMinor: { type: Number, required: true },
      termMonths: { type: Number, required: true },
    },
    retentionYears: { type: Number, default: 7 }, // FR-704 statutory 7-year storage
  },
  { timestamps: true }
);

export const EsignModel = mongoose.model<IEsign>("Esign", EsignSchema);
