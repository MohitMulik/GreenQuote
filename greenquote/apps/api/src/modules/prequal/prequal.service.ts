import { PrequalificationModel } from "./prequal.model.js";
import { OfferModel, IOfferDocument } from "../offers/offer.model.js";
import { QuoteModel } from "../quotes/quote.model.js";
import { AuditEventModel } from "../admin/audit.model.js";
import { calculateEmi } from "@greenquote/shared";
import { QuoteTier } from "@greenquote/shared";
import { encryptPii } from "../../security/pii-vault.js";
import { randomId } from "../../lib/ids.js";

export interface PrequalInput {
  quoteId: string;
  selectedTier: QuoteTier;
  downPaymentMinor: number;
  applicant: {
    dateOfBirth: string;
    annualIncomeMinor: number;
    housingPaymentMinor: number;
    ssnLastFour: string;
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
    const ssnLastFourEncrypted = encryptPii(input.applicant.ssnLastFour);

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
          { name: "Public Sector Bank (PM Surya Ghar)", baseRate: 5.75, term: 60, buyDown: 0 },
          { name: "Co-operative Bank Green Loan", baseRate: 7.50, term: 60, buyDown: Math.round(principalMinor * 0.023) },
          { name: "Clean Energy NBFC", baseRate: 10.50, term: 84, buyDown: 0 },
        ]
      : [
          { name: "Clean Energy Federal Credit Union", baseRate: 6.99, term: 60, buyDown: 0 },
          { name: "Community Green Bank (Buy-Down Active)", baseRate: 7.49, term: 84, buyDown: Math.min(Math.round(principalMinor * 0.035), Math.floor(principalMinor * 0.05)) },
          { name: "EcoFinance Specialty Point-of-Sale", baseRate: 9.99, term: 120, buyDown: 0 },
        ];

    const offers: IOfferDocument[] = [];

    for (const cfg of lenderConfigs) {
      const emiCalc = calculateEmi({
        amountFinancedMinor: principalMinor,
        annualRatePct: cfg.baseRate,
        termMonths: cfg.term,
      });

      const offer = await OfferModel.create({
        prequalificationId,
        lenderId: `lnd_${randomId(8)}`,
        lenderName: cfg.name,
        aprPct: cfg.baseRate,
        termMonths: cfg.term,
        monthlyPaymentMinor: emiCalc.monthlyPaymentMinor,
        amountFinancedMinor: principalMinor,
        totalCostOfCreditMinor: emiCalc.totalRepaymentMinor,
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
