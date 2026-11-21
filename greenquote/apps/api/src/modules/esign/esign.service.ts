import crypto from "node:crypto";
import { EsignModel, IEsign, FTC_HOLDER_RULE_NOTICE } from "./esign.model.js";
import { OfferModel } from "../offers/offer.model.js";
import { QuoteModel } from "../quotes/quote.model.js";
import { PrequalificationModel } from "../prequal/prequal.model.js";
import { MilestoneModel } from "../milestones/milestone.model.js";
import { calculateRescissionEndDate } from "../milestones/rescission.js";
import { AuditEventModel } from "../admin/audit.model.js";
import { AppError } from "../../lib/errors.js";

export interface SubmitEsignInput {
  offerId: string;
  signatureDataUrl: string;
  esignConsentAgreed: boolean;
  tilaAcknowledged: boolean;
  signerIp: string;
  userAgent: string;
}

export class EsignService {
  async submitSignature(input: SubmitEsignInput): Promise<IEsign> {
    const { offerId, signatureDataUrl, esignConsentAgreed, tilaAcknowledged, signerIp, userAgent } = input;

    if (!esignConsentAgreed) {
      throw new AppError(400, "ESIGN_CONSENT_REQUIRED", "E-SIGN electronic disclosure consent is required.");
    }

    if (!tilaAcknowledged) {
      throw new AppError(400, "TILA_ACKNOWLEDGMENT_REQUIRED", "Truth in Lending Act (TILA) Reg Z disclosure must be acknowledged.");
    }

    // 1. Locate Offer
    const offer = await OfferModel.findById(offerId);
    if (!offer) {
      throw new AppError(404, "OFFER_NOT_FOUND", "Loan offer not found or expired.");
    }

    if (offer.status === "selected") {
      throw new AppError(409, "ALREADY_SIGNED", "This loan offer has already been signed.");
    }

    // 2. Locate Prequal & Quote
    const prequal = await PrequalificationModel.findById(offer.prequalificationId);
    if (!prequal) {
      throw new AppError(404, "PREQUAL_NOT_FOUND", "Prequalification record not found.");
    }

    const quote = await QuoteModel.findById(prequal.quoteId);
    if (!quote) {
      throw new AppError(404, "QUOTE_NOT_FOUND", "Associated quote not found.");
    }

    const quoteIdStr = quote._id.toString();

    // 3. Calculate Cryptographic Integrity Hash
    const rawPayload = `${offerId}|${quoteIdStr}|${offer.amountFinancedMinor}|${offer.aprPct}|${signerIp}|${new Date().toISOString()}`;
    const signatureHash = crypto.createHash("sha256").update(rawPayload).digest("hex");

    // 4. Create Immutable E-Signature Record
    const esign = await EsignModel.create({
      offerId,
      quoteId: quoteIdStr,
      contractorId: quote.contractorId,
      homeownerEmail: quote.homeowner.email,
      signatureDataUrl,
      signatureHash,
      tilaAcknowledged: true,
      esignConsentAgreed: true,
      ftcHolderRuleAcknowledged: true,
      ftcHolderRuleNotice: FTC_HOLDER_RULE_NOTICE,
      signerIp,
      userAgent,
      tilaDisclosures: {
        aprPct: offer.aprPct,
        amountFinancedMinor: offer.amountFinancedMinor,
        financeChargeMinor: offer.totalCostOfCreditMinor - offer.amountFinancedMinor,
        totalOfPaymentsMinor: offer.totalCostOfCreditMinor,
        monthlyPaymentMinor: offer.monthlyPaymentMinor,
        termMonths: offer.termMonths,
      },
      retentionYears: 7,
    });

    // 5. Update Offer Status to 'selected'
    offer.status = "selected";
    await offer.save();

    // 6. Update Quote Status to 'signed'
    quote.status = "signed";
    await quote.save();

    // 7. Initialize Installation Milestones & 3-Business-Day Rescission Clock (FR-801, CMP-07, CMP-08, FR-805)
    const existingMilestone = await MilestoneModel.findOne({ loanId: offerId });
    const rescissionPeriodEndsAt = calculateRescissionEndDate(new Date(), 3);
    if (!existingMilestone) {
      await MilestoneModel.create({
        loanId: offerId,
        contractorId: quote.contractorId,
        homeownerId: quote.homeowner.phone,
        type: "final_completion",
        amountMinor: offer.amountFinancedMinor,
        status: "pending",
        equipmentVerified: false,
        evidenceUrls: [],
        rescissionPeriodEndsAt,
        rescissionStatus: "active",
      });
    }

    // 8. Write Audit Event (FR-1004)
    await AuditEventModel.create({
      actor: { userId: quote.homeowner.email, role: "homeowner", ipAddress: signerIp },
      action: "LOAN_AGREEMENT_ESIGNED",
      entityType: "loan",
      entityId: offerId,
      contractorId: quote.contractorId,
      payload: {
        offerId,
        quoteId: quoteIdStr,
        signatureHash,
        amountFinancedMinor: offer.amountFinancedMinor,
        aprPct: offer.aprPct,
      },
    });

    return esign.toObject ? esign.toObject() : esign;
  }

  async getEsignRecord(offerId: string): Promise<IEsign | null> {
    const record = await EsignModel.findOne({ offerId }).lean();
    return record as IEsign | null;
  }
}

export const esignService = new EsignService();
