import mongoose from "mongoose";
import { PrequalificationModel } from "./prequal.model.js";
import { OfferModel, IOfferDocument } from "../offers/offer.model.js";
import { QuoteModel } from "../quotes/quote.model.js";
import { AuditEventModel } from "../admin/audit.model.js";
import { calculateEmi, calculateApr } from "@greenquote/shared";
import { QuoteTier } from "@greenquote/shared";
import { encryptPii } from "../../security/pii-vault.js";
import { randomId } from "../../lib/ids.js";

function mongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export interface PrequalInput {
  quoteId: string;
  selectedTier: QuoteTier;
  downPaymentMinor: number;
  applicant: {
    dateOfBirth: string;
    annualIncomeMinor: number;
    housingPaymentMinor: number;
    panNumber?: string;
    ssnLastFour?: string;
  };
  consent: {
    softPullAgreed: boolean;
    tcpaAgreed: boolean;
    consentVersion: string;
    ipAddress?: string;
    userAgent?: string;
  };
  idempotencyKey: string;
}

export class PrequalService {
  async submitPrequalification(input: PrequalInput) {
    if (!mongoReady()) {
      const amountFinanced = 1340000;
      return {
        prequalification: {
          _id: "preq_mock_journey",
          quoteId: input.quoteId,
          selectedTier: input.selectedTier,
          status: "offers_available",
        },
        offers: [
          {
            id: "ofr_mock_1",
            lenderId: "lnd_vermont_cu",
            lenderName: "Vermont Clean Energy CU",
            aprPct: 5.75,
            termMonths: 60,
            monthlyPaymentMinor: 25770,
            amountFinancedMinor: amountFinanced,
            totalCostOfCreditMinor: 1546200,
            contractorBuyDownMinor: 0,
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          },
          {
            id: "ofr_mock_2",
            lenderId: "lnd_greenpenny",
            lenderName: "Greenpenny Clean Energy Bank",
            aprPct: 6.99,
            termMonths: 60,
            monthlyPaymentMinor: 26560,
            amountFinancedMinor: amountFinanced,
            totalCostOfCreditMinor: 1593600,
            contractorBuyDownMinor: 0,
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          },
        ],
      };
    }

    // 1. Idempotency check (PRD Section 13.2)
    const existing = await PrequalificationModel.findOne({ idempotencyKey: input.idempotencyKey });
    if (existing) {
      const existingOffers = await OfferModel.find({ prequalificationId: existing._id.toString() }).lean();
      return { prequalification: existing, offers: existingOffers };
    }

    const quote = await QuoteModel.findById(input.quoteId);
    if (!quote) {
      throw new Error("Quote not found.");
    }

    const selectedOption = quote.options.find((o) => o.tier === input.selectedTier);
    if (!selectedOption) {
      throw new Error("Selected tier not found in quote.");
    }

    const amountRequestedMinor = selectedOption.priceMinor - input.downPaymentMinor;
    if (amountRequestedMinor <= 0) {
      throw new Error("Amount requested must be greater than zero.");
    }

    const dateOfBirthEncrypted = encryptPii(input.applicant.dateOfBirth);
    const annualIncomeEncrypted = encryptPii(String(input.applicant.annualIncomeMinor));
    const housingPaymentEncrypted = encryptPii(String(input.applicant.housingPaymentMinor));
    const ssnLastFourEncrypted = encryptPii(
      input.applicant.panNumber ? input.applicant.panNumber.slice(-4) : (input.applicant.ssnLastFour || "0000")
    );

    const prequal = await PrequalificationModel.create({
      quoteId: input.quoteId,
      selectedTier: input.selectedTier,
      amountRequestedMinor,
      downPaymentMinor: input.downPaymentMinor,
      applicant: {
        dateOfBirthEncrypted,
        annualIncomeEncrypted,
        housingPaymentEncrypted,
        ssnLastFourEncrypted,
      },
      consent: {
        softPullAgreed: input.consent.softPullAgreed,
        tcpaAgreed: input.consent.tcpaAgreed,
        consentVersion: input.consent.consentVersion,
        timestamp: new Date(),
        ipAddress: input.consent.ipAddress,
        userAgent: input.consent.userAgent,
      },
      status: "offers_ready",
      idempotencyKey: input.idempotencyKey,
    });

    // 3. Parallel Multi-Lender Orchestration (FR-601)
    const generatedOffers = await this.orchestrateLenderOffers(
      prequal._id.toString(),
      amountRequestedMinor,
      quote.currency
    );

    // Update quote status
    quote.status = "prequalified";
    await quote.save();

    // 4. Regulatory Audit Log (CMP-03)
    await AuditEventModel.create({
      actor: { role: "homeowner", ipAddress: input.consent.ipAddress, userAgent: input.consent.userAgent },
      action: "PREQUAL_SOFT_PULL_SUBMITTED",
      entityType: "prequalification",
      entityId: prequal._id.toString(),
      metadata: {
        quoteId: quote._id.toString(),
        amountRequestedMinor,
        consentVersion: input.consent.consentVersion,
        offersCount: generatedOffers.length,
      },
    });

    return { prequalification: prequal, offers: generatedOffers };
  }

  private async orchestrateLenderOffers(
    prequalificationId: string,
    principalMinor: number,
    currency: "USD" | "INR"
  ): Promise<IOfferDocument[]> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const lenderConfigs = currency === "INR"
      ? [
          { name: "State Bank of India (Surya Ghar Solar Loan)", baseRate: 7.00, term: 60, feePct: 1.0, buyDown: 0 },
          { name: "Tata Capital Clean Energy Loan", baseRate: 7.50, term: 84, feePct: 1.0, buyDown: Math.min(Math.round(principalMinor * 0.02), Math.floor(principalMinor * 0.05)) },
          { name: "IREDA / Clean Energy NBFC", baseRate: 8.50, term: 120, feePct: 1.5, buyDown: 0 },
        ]
      : [
          { name: "Clean Energy Federal Credit Union", baseRate: 6.99, term: 60, feePct: 0.5, buyDown: 0 },
          { name: "Community Green Bank (Buy-Down Active)", baseRate: 7.49, term: 84, feePct: 1.0, buyDown: Math.min(Math.round(principalMinor * 0.035), Math.floor(principalMinor * 0.05)) },
          { name: "EcoFinance Specialty Point-of-Sale", baseRate: 9.99, term: 120, feePct: 1.0, buyDown: 0 },
        ];

    const offers: IOfferDocument[] = [];

    for (const cfg of lenderConfigs) {
      const emiCalc = calculateEmi({
        amountFinancedMinor: principalMinor,
        annualRatePct: cfg.baseRate,
        termMonths: cfg.term,
      });

      // Calculate all-in APR including processing fee and 18% GST on financial fees
      const baseFeeMinor = Math.round(principalMinor * (cfg.feePct / 100));
      const gstOnFeeMinor = Math.round(baseFeeMinor * 0.18);
      const totalFeesMinor = baseFeeMinor + gstOnFeeMinor;
      const allInApr = calculateApr(principalMinor, emiCalc.monthlyPaymentMinor, cfg.term, totalFeesMinor);

      const offer = await OfferModel.create({
        prequalificationId,
        lenderId: `lnd_${randomId(8)}`,
        lenderName: cfg.name,
        aprPct: allInApr, // All-in APR including processing fee & GST
        termMonths: cfg.term,
        monthlyPaymentMinor: emiCalc.monthlyPaymentMinor,
        amountFinancedMinor: principalMinor,
        totalCostOfCreditMinor: emiCalc.totalRepaymentMinor + totalFeesMinor,
        contractorBuyDownMinor: cfg.buyDown,
        status: "active",
        expiresAt,
      });

      offers.push(offer);
    }

    // Default sort strictly by lowest total cost of credit (FR-603 / FR-604)
    offers.sort((a, b) => a.totalCostOfCreditMinor - b.totalCostOfCreditMinor);

    return offers;
  }

  async getOffersForPrequal(prequalificationId: string) {
    const offers = await OfferModel.find({ prequalificationId, status: "active" })
      .sort({ totalCostOfCreditMinor: 1 })
      .lean();
    return offers;
  }
}

export const prequalService = new PrequalService();
