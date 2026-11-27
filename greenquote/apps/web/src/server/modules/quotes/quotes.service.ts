import bcrypt from "bcryptjs";
import { config } from "../../config/index";
import { randomId } from "../../lib/ids";
import { QuoteModel, IQuoteDocument } from "./quote.model";
import { calculateFinancingBreakdown, IncentiveItem } from "@greenquote/shared";
import { savingsService } from "../savings/savings.service";
import { incentiveService } from "../incentives/incentive.service";
import { AuditEventModel } from "../admin/audit.model";
import { Currency, QuoteTier, LineItem } from "@greenquote/shared";

export interface CreateQuoteInput {
  contractorId: string;
  advisorId: string;
  currency: Currency;
  homeowner: { fullName: string; phone: string; email: string };
  property: {
    streetAddress: string;
    city: string;
    state: string;
    pinCode?: string;
    zipCode?: string;
    existingHeatingFuel: string;
    electricUtility?: string;
  };
  options: Array<{
    tier: QuoteTier;
    title: string;
    description?: string;
    priceMinor: number;
    lineItems: LineItem[];
  }>;
}

export class QuotesService {
  async createQuote(input: CreateQuoteInput): Promise<IQuoteDocument> {
    const linkToken = randomId(32);
    const linkExpiresAt = new Date();
    linkExpiresAt.setDate(linkExpiresAt.getDate() + 30); // 30-day expiration (FR-307)

    // Build enriched options with rebates, energy savings, and example EMIs
    const enrichedOptions = [];

    for (const opt of input.options) {
      // 1. Detect if solar equipment is present in line items
      const isSolar = input.currency === "INR" || opt.lineItems.some((li) =>
        li.type === "equipment" && (li.label.toLowerCase().includes("solar") || li.label.toLowerCase().includes("inverter") || li.label.toLowerCase().includes("pv"))
      );
      const equipmentCat = isSolar ? "solar_pv" : "heat_pump";

      // Calculate eligible incentives based on actual system category
      const incentives = await incentiveService.calculateEligibleIncentives({
        state: input.property.state,
        equipmentCategory: equipmentCat,
      });

      // 2. Calculate savings estimate
      const savings = savingsService.calculateSavings({
        category: isSolar ? "solar_panel" : "heat_pump",
        state: input.property.state,
        existingFuel: input.property.existingHeatingFuel,
        solarCapacityKw: isSolar ? (opt.tier === "good" ? 2 : opt.tier === "better" ? 3 : 5) : undefined,
      });

      // 3. Compute Example EMI using centralized financing engine
      // Standard example assumption: 10% down, 60 months, 7.00% APR for INR (SBI clean energy rate) or 7.99% for USD
      const exampleRate = input.currency === "INR" ? 7.00 : 7.99;
      const downPaymentMinor = Math.round(opt.priceMinor * 0.1);

      const mappedIncentives: IncentiveItem[] = incentives.map((item) => ({
        id: item.programmeId,
        name: item.name,
        amountMinor: item.amountMinor,
        category: item.paymentTiming === "instant" ? "pm_surya_ghar_cfa" : "post_install_rebate",
        timing: item.paymentTiming,
      }));

      const financingResult = calculateFinancingBreakdown({
        grossPriceMinor: opt.priceMinor,
        downPaymentMinor,
        incentives: mappedIncentives,
        annualRatePct: exampleRate,
        termMonths: 60,
      });

      enrichedOptions.push({
        tier: opt.tier,
        title: opt.title,
        description: opt.description,
        priceMinor: opt.priceMinor, // STRICT: Same cash & financed price (FR-308)
        lineItems: opt.lineItems,
        incentives: incentives.map((item) => ({
          programmeId: item.programmeId,
          name: item.name,
          amountMinor: item.amountMinor,
          paid: item.paymentTiming,
          conditions: item.conditions,
        })),
        estimatedSavings: {
          minAnnualMinor: savings.minAnnualSavingsMinor,
          maxAnnualMinor: savings.maxAnnualSavingsMinor,
          assumptions: savings.assumptions,
        },
        exampleEmi: {
          ratePct: exampleRate,
          termMonths: 60,
          downPaymentMinor: financingResult.clampedDownPaymentMinor,
          emiMinor: financingResult.monthlyPaymentMinor,
          aprPct: exampleRate,
        },
      });
    }

    const quote = await QuoteModel.create({
      contractorId: input.contractorId,
      advisorId: input.advisorId,
      currency: input.currency,
      status: "draft",
      version: 1,
      homeowner: input.homeowner,
      property: input.property,
      options: enrichedOptions,
      linkToken,
      linkExpiresAt,
    });

    // Record audit event
    await AuditEventModel.create({
      actor: { userId: input.advisorId, role: "contractor_advisor" },
      action: "QUOTE_CREATED",
      entityType: "quote",
      entityId: quote._id.toString(),
      metadata: { homeowner: input.homeowner.fullName, optionsCount: input.options.length },
    });

    return quote;
  }

  async getQuoteById(id: string, contractorId?: string) {
    const filter: Record<string, unknown> = { _id: id };
    if (contractorId) {
      filter["contractorId"] = contractorId;
    }
    return QuoteModel.findOne(filter).lean();
  }

  async getQuoteByToken(token: string, isVerified: boolean = false): Promise<Record<string, unknown>> {
    const quote = await QuoteModel.findOne({
      linkToken: token,
      linkExpiresAt: { $gte: new Date() },
    }).lean();

    if (!quote) {
      const err = new Error("This quote link is invalid or has expired.") as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }

    if (isVerified) {
      return {
        ...quote,
        isVerified: true,
      };
    }

    // Mask sensitive homeowner PII for unauthenticated public preview
    const rawName = quote.homeowner.fullName || "";
    const nameParts = rawName.trim().split(/\s+/);
    const maskedName = nameParts
      .map((part: string) => (part.length > 1 ? `${part[0]}****` : part))
      .join(" ");

    const rawPhone = quote.homeowner.phone || "";
    const maskedPhone =
      rawPhone.length > 4 ? `${rawPhone.slice(0, 3)} ***** ${rawPhone.slice(-3)}` : "****";

    const rawEmail = quote.homeowner.email || "";
    const emailParts = rawEmail.split("@");
    const maskedEmail =
      emailParts.length === 2 && emailParts[0]
        ? `${emailParts[0].slice(0, 2)}****@${emailParts[1]}`
        : "****";

    return {
      ...quote,
      homeowner: {
        fullName: maskedName,
        phone: maskedPhone,
        email: maskedEmail,
      },
      property: {
        ...quote.property,
        streetAddress: "•••••••• (Verified upon homeowner OTP)",
      },
      isVerified: false,
      requiresVerification: true,
    };
  }

  async sendQuote(quoteId: string, contractorId: string) {
    const quote = await QuoteModel.findOne({ _id: quoteId, contractorId });
    if (!quote) {
      throw new Error("Quote not found.");
    }

    // Generate 6-digit OTP for secure passwordless homeowner access (FR-103)
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const otpExpiresAt = new Date();
    otpExpiresAt.setHours(otpExpiresAt.getHours() + 24);

    quote.status = "sent";
    quote.otpHash = otpHash;
    quote.otpExpiresAt = otpExpiresAt;
    quote.smsConsentRecorded = true;
    await quote.save();

    await AuditEventModel.create({
      actor: { role: "contractor_advisor" },
      action: "QUOTE_SENT_SMS",
      entityType: "quote",
      entityId: quote._id.toString(),
      metadata: { recipientPhone: quote.homeowner.phone },
    });

    const isDevOrTest = !config.isProduction && config.nodeEnv !== "production";

    return {
      success: true,
      quoteId: quote._id.toString(),
      link: `/quote/${quote.linkToken}`,
      ...(isDevOrTest ? { testOtp: rawOtp } : {}),
    };
  }

  async getContractorPipeline(contractorId: string, advisorId?: string, isOwner: boolean = false) {
    const filter: Record<string, unknown> = { contractorId };
    if (!isOwner && advisorId) {
      filter["advisorId"] = advisorId; // Advisor sees only their own quotes (FR-901)
    }

    return QuoteModel.find(filter)
      .sort({ createdAt: -1 })
      .select("homeowner property options status currency createdAt linkToken")
      .lean();
  }
}

export const quotesService = new QuotesService();
