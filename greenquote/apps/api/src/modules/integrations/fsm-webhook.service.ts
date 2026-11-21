import crypto from "crypto";
import { logger } from "../../lib/logger.js";

export type FsmProvider = "jobber" | "servicetitan" | "housecall_pro";

export interface FsmQuotePayload {
  provider: FsmProvider;
  contractorId: string;
  externalJobId: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
    propertyAddress: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  lineItems: Array<{
    category: "equipment" | "labor" | "permits" | "electrical" | "other";
    description: string;
    amountCents: number;
  }>;
  cashPriceCents: number;
  financedPriceCents: number;
}

export interface FsmSyncResult {
  success: boolean;
  greenQuoteId: string;
  externalJobId: string;
  provider: FsmProvider;
  parityCompliant: boolean;
  totalSystemCostCents: number;
  message: string;
}

/**
 * Validates FSM HMAC Webhook Signature
 */
export function verifyFsmWebhookSignature(
  payloadString: string,
  signatureHeader: string,
  secretKey: string
): boolean {
  if (!signatureHeader || !secretKey) return false;
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(payloadString)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(signatureHeader));
}

/**
 * Ingests external estimates from Jobber, ServiceTitan, or Housecall Pro (FR-310)
 * Strictly verifies Cash / Financed parity (FR-308) before importing.
 */
export function processFsmQuoteSync(payload: FsmQuotePayload): FsmSyncResult {
  const lineItemTotal = payload.lineItems.reduce((acc, item) => acc + item.amountCents, 0);

  // Parity check: financed price must match cash price (FR-308)
  const parityCompliant = payload.cashPriceCents === payload.financedPriceCents;
  if (!parityCompliant) {
    logger.warn(
      { externalJobId: payload.externalJobId, provider: payload.provider },
      "FSM webhook rejected: cash and financed prices do not match (FR-308 violation)"
    );
    throw new Error(
      `FR-308 Parity Violation: Financed price ($${(payload.financedPriceCents / 100).toFixed(2)}) ` +
      `does not match cash price ($${(payload.cashPriceCents / 100).toFixed(2)})`
    );
  }

  // Sum check
  if (lineItemTotal !== payload.cashPriceCents) {
    logger.warn(
      { lineItemTotal, cashPriceCents: payload.cashPriceCents },
      "FSM quote line items do not sum to total cash price"
    );
    throw new Error("Line item amounts do not equal stated total cash price");
  }

  const greenQuoteId = `gq_fsm_${payload.provider.substring(0, 3)}_${crypto.randomBytes(6).toString("hex")}`;

  logger.info(
    { greenQuoteId, externalJobId: payload.externalJobId, provider: payload.provider },
    "FSM quote synchronized successfully"
  );

  return {
    success: true,
    greenQuoteId,
    externalJobId: payload.externalJobId,
    provider: payload.provider,
    parityCompliant: true,
    totalSystemCostCents: payload.cashPriceCents,
    message: `Quote imported from ${payload.provider.toUpperCase()} with 100% price parity verified.`,
  };
}
