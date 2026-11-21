import { z } from "zod";

/**
 * Rejects Mongo operator-style strings without blocking legitimate dots
 * (emails, model numbers, street names).
 */
export const noMongoInjection = (val: string) =>
  !val.includes("\0") && !/^\$/.test(val.trim());

export const safeString = z
  .string()
  .refine(noMongoInjection, {
    message: "Invalid characters in input.",
  });

export function safeText(min = 1, max?: number) {
  let s = z.string().min(min);
  if (max !== undefined) {
    s = s.max(max);
  }
  return s.refine(noMongoInjection, {
    message: "Invalid characters in input.",
  });
}

export const UserRoleSchema = z.enum([
  "contractor_owner",
  "contractor_advisor",
  "homeowner",
  "lender_user",
  "operations",
]);

export const CurrencySchema = z.enum(["USD", "INR"]);

export const QuoteTierSchema = z.enum(["good", "better", "best"]);

export const LineItemTypeSchema = z.enum([
  "equipment",
  "labour",
  "electrical",
  "permits",
  "other",
]);

export const LineItemSchema = z.object({
  type: LineItemTypeSchema,
  label: safeText(2, 100),
  amountMinor: z.number().int().positive("Line item amount must be positive."),
  equipmentId: safeString.optional(),
});

export const QuoteIncentiveSchema = z.object({
  programmeId: safeString,
  name: safeText(2, 100),
  amountMinor: z.number().int().nonnegative(),
  paid: z.enum(["instant", "after_installation"]),
  conditions: safeText(0, 300),
});

export const QuoteOptionSchema = z.object({
  tier: QuoteTierSchema,
  title: safeText(2, 100),
  description: safeText(0, 500).optional(),
  priceMinor: z.number().int().positive("Price must be greater than zero."),
  lineItems: z.array(LineItemSchema).min(1, "At least one line item is required."),
  incentives: z.array(QuoteIncentiveSchema).default([]),
});

export const CreateQuoteSchema = z.object({
  currency: CurrencySchema.default("USD"),
  homeowner: z.object({
    fullName: safeText(2, 100),
    phone: safeText(10, 15),
    email: z.string().email(),
  }),
  property: z.object({
    streetAddress: safeText(5, 150),
    city: safeText(2, 50),
    state: z
      .string()
      .length(2)
      .transform((val) => val.toUpperCase())
      .refine(noMongoInjection, { message: "Invalid characters in input." }),
    zipCode: z
      .string()
      .regex(/^\d{5}(-\d{4})?$|^\d{6}$/, "Valid US or IN postal code required.")
      .refine(noMongoInjection, { message: "Invalid characters in input." }),
    existingHeatingFuel: safeString.default("natural_gas"),
    electricUtility: safeString.optional(),
  }),
  options: z.array(QuoteOptionSchema).min(1).max(3),
}).refine(
  (data) => {
    // Validate arithmetic integrity for each tier
    for (const opt of data.options) {
      const sum = opt.lineItems.reduce((acc, item) => acc + item.amountMinor, 0);
      if (sum !== opt.priceMinor) {
        return false;
      }
    }
    return true;
  },
  {
    message: "Option priceMinor must exactly equal the sum of its line items.",
    path: ["options"],
  }
);

export const PrequalificationSubmitSchema = z.object({
  quoteId: safeString,
  selectedTier: QuoteTierSchema,
  downPaymentMinor: z.number().int().nonnegative().default(0),
  applicant: z.object({
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
    annualIncomeMinor: z.number().int().positive("Annual income must be positive"),
    housingPaymentMinor: z.number().int().nonnegative("Housing payment cannot be negative"),
    ssnLastFour: z.string().regex(/^\d{4}$/, "Must be exactly the last 4 digits of SSN"),
  }),
  consent: z.object({
    softPullAgreed: z.literal(true, {
      errorMap: () => ({ message: "FCRA soft-pull consent is required." }),
    }),
    tcpaAgreed: z.boolean().default(true),
    consentVersion: safeString.default("2026-v1"),
  }),
});

export const ESignSubmitSchema = z.object({
  offerId: safeString,
  signatureDataUrl: z.string().min(20, "Valid signature drawing required."),
  esignConsentAgreed: z.literal(true, {
    errorMap: () => ({ message: "E-SIGN electronic disclosure consent required." }),
  }),
  tilaAcknowledged: z.literal(true, {
    errorMap: () => ({ message: "Truth in Lending Act (TILA) disclosure acknowledgment required." }),
  }),
});

export const HomeownerCompletionConfirmSchema = z.object({
  milestoneId: safeString,
  confirmed: z.literal(true, {
    errorMap: () => ({ message: "You must confirm job completion to release payout." }),
  }),
  feedbackRating: z.number().int().min(1).max(5).optional(),
});

export const RegisterContractorSchema = z.object({
  legalName: z.string().min(2).max(150),
  tradeName: z.string().max(150).optional(),
  ein: z.string().min(9).max(20),
  businessAddress: z.object({
    street: z.string().min(2).max(150),
    city: z.string().min(2).max(80),
    state: z.string().length(2).toUpperCase(),
    zipCode: z.string().min(5).max(10),
  }),
  owner: z.object({
    fullName: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().min(10).max(20),
    password: z.string().min(8).max(128),
  }),
  platformAgreement: z
    .object({
      version: z.string().default("2026-v1"),
      accepted: z.literal(true),
    })
    .optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const MfaVerifySchema = z.object({
  mfaToken: z.string().min(10),
  code: z.string().regex(/^\d{6}$/),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});

export const HomeownerRequestOtpSchema = z.object({
  quoteToken: z.string().min(8),
  channel: z.enum(["sms", "email"]).default("sms"),
});

export const HomeownerVerifyOtpSchema = z.object({
  quoteToken: z.string().min(8),
  code: z.string().regex(/^\d{6}$/),
});
