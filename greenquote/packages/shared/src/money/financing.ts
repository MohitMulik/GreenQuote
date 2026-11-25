import { calculateEmiSafe } from "./calculator.js";

export type IncentiveCategory =
  | "pos_utility_rebate"      // Instant Point-of-Sale Utility Rebate (e.g. Mass Save, TECH Clean CA) -> deducted immediately
  | "federal_tax_credit"      // Claimed post-installation on tax return (IRA Section 25C / 25D) -> NEVER deducted at POS
  | "state_tax_credit"        // Claimed on state tax return -> NEVER deducted at POS
  | "post_install_rebate";    // Paid by check/direct deposit to homeowner months after install -> NOT deducted at POS

export type IncentivePaymentTiming = "instant" | "after_installation";

export interface IncentiveItem {
  id: string;
  name: string;
  amountMinor: number;
  category: IncentiveCategory;
  timing: IncentivePaymentTiming;
  description?: string;
}

export interface FinancingCalculationInput {
  grossPriceMinor: number;
  downPaymentMinor: number;
  incentives?: IncentiveItem[];
  annualRatePct: number;
  termMonths: number;
  contractorBuyDownPct?: number; // Optional buy-down (e.g. 3.2% of financed amount)
}

export interface FinancingValidationError {
  field: string;
  message: string;
}

export interface FinancingCalculationResult {
  grossPriceMinor: number;

  // Incentives Breakdown
  posRebatesMinor: number;        // Sum of all instant POS utility rebates
  taxCreditsMinor: number;        // Sum of all future federal and state tax credits
  postInstallRebatesMinor: number;// Sum of post-installation mail-in rebates
  totalIncentivesMinor: number;   // posRebates + taxCredits + postInstallRebates

  // Point-of-Sale Net Invoice
  netInvoiceMinor: number;        // grossPriceMinor - posRebatesMinor

  // Down Payment & Amount Financed
  requestedDownPaymentMinor: number;
  clampedDownPaymentMinor: number;// Clamped to prevent negative principal
  amountFinancedMinor: number;    // netInvoiceMinor - clampedDownPaymentMinor

  // Amortization & TILA Metrics
  annualRatePct: number;
  termMonths: number;
  monthlyPaymentMinor: number;    // Actuarially computed EMI (half-up rounding)
  totalPaymentsMinor: number;     // monthlyPaymentMinor * termMonths
  financeChargeMinor: number;     // totalPaymentsMinor - amountFinancedMinor

  // Contractor Buy-Down
  contractorBuyDownMinor: number; // Buy-down cost, capped at 5% of amount financed
  isBuyDownWithinCap: boolean;

  // Total Lifetime Net Out-of-Pocket Cost (incorporating future tax credits)
  effectiveNetCostMinor: number;

  // Explicit Consumer & Compliance Disclosures
  disclosures: {
    posDeductionExplanation: string;
    taxCreditNotice: string;
    isZeroFinanced: boolean;
  };
}

/**
 * Validates financing inputs and returns any structural or regulatory violations.
 */
export function validateFinancingInput(input: FinancingCalculationInput): FinancingValidationError[] {
  const errors: FinancingValidationError[] = [];

  if (!Number.isFinite(input.grossPriceMinor) || input.grossPriceMinor <= 0) {
    errors.push({ field: "grossPriceMinor", message: "Gross price must be a positive integer in minor units." });
  }

  if (!Number.isFinite(input.downPaymentMinor) || input.downPaymentMinor < 0) {
    errors.push({ field: "downPaymentMinor", message: "Down payment cannot be negative." });
  }

  if (!Number.isFinite(input.annualRatePct) || input.annualRatePct < 0) {
    errors.push({ field: "annualRatePct", message: "Annual rate percentage cannot be negative." });
  }

  if (!Number.isFinite(input.termMonths) || input.termMonths <= 0 || !Number.isInteger(input.termMonths)) {
    errors.push({ field: "termMonths", message: "Term months must be a positive integer." });
  }

  if (input.contractorBuyDownPct !== undefined) {
    if (!Number.isFinite(input.contractorBuyDownPct) || input.contractorBuyDownPct < 0 || input.contractorBuyDownPct > 15) {
      errors.push({ field: "contractorBuyDownPct", message: "Contractor buy-down percentage must be between 0% and 15%." });
    }
  }

  if (input.incentives) {
    let i = 0;
    for (const inc of input.incentives) {
      if (!inc.name || typeof inc.name !== "string") {
        errors.push({ field: `incentives[${i}].name`, message: "Incentive name is required." });
      }
      if (!Number.isFinite(inc.amountMinor) || inc.amountMinor < 0) {
        errors.push({ field: `incentives[${i}].amountMinor`, message: "Incentive amount cannot be negative." });
      }
      // Strict rule: Tax credits must NEVER be classified as instant POS timing
      if (
        (inc.category === "federal_tax_credit" || inc.category === "state_tax_credit") &&
        inc.timing === "instant"
      ) {
        errors.push({
          field: `incentives[${i}].timing`,
          message: `Tax credit "${inc.name}" cannot be applied as an instant point-of-sale deduction under federal lending rules.`,
        });
      }
      i++;
    }
  }

  return errors;
}

/**
 * Centralized Financial Calculation Engine for GreenQuote Clean Energy Lending.
 * 
 * Enforces:
 * - Proper classification and deduction of instant POS utility rebates (e.g. Mass Save $10k).
 * - Strict non-deduction of future tax credits (e.g. IRA 25C $2k) at the point of sale.
 * - Integer-safe minor unit arithmetic with zero floating-point drift.
 * - Non-throwing handling of zero-financed or 100% cash scenarios.
 * - Capped 5% contractor buy-downs (FR-603).
 */
export function calculateFinancingBreakdown(input: FinancingCalculationInput): FinancingCalculationResult {
  const grossPriceMinor = Math.max(0, Math.round(input.grossPriceMinor || 0));
  const requestedDownPaymentMinor = Math.max(0, Math.round(input.downPaymentMinor || 0));
  const rate = Math.max(0, Number(input.annualRatePct) || 0);
  const termMonths = Math.max(1, Math.round(input.termMonths || 60));

  // 1. Separate incentives by timing and category
  let posRebatesMinor = 0;
  let taxCreditsMinor = 0;
  let postInstallRebatesMinor = 0;

  if (input.incentives && Array.isArray(input.incentives)) {
    for (const inc of input.incentives) {
      const amount = Math.max(0, Math.round(inc.amountMinor || 0));
      if (inc.timing === "instant" && inc.category === "pos_utility_rebate") {
        posRebatesMinor += amount;
      } else if (inc.category === "federal_tax_credit" || inc.category === "state_tax_credit") {
        taxCreditsMinor += amount;
      } else {
        postInstallRebatesMinor += amount;
      }
    }
  }

  // POS rebates cannot exceed the gross price
  posRebatesMinor = Math.min(grossPriceMinor, posRebatesMinor);
  const totalIncentivesMinor = posRebatesMinor + taxCreditsMinor + postInstallRebatesMinor;

  // 2. Compute Net Invoice at Point of Sale
  const netInvoiceMinor = Math.max(0, grossPriceMinor - posRebatesMinor);

  // 3. Compute Clamped Down Payment
  // Down payment cannot exceed the net invoice
  const clampedDownPaymentMinor = Math.min(requestedDownPaymentMinor, netInvoiceMinor);

  // 4. Compute Amount Financed
  const amountFinancedMinor = Math.max(0, netInvoiceMinor - clampedDownPaymentMinor);
  const isZeroFinanced = amountFinancedMinor === 0;

  // 5. Actuarial Amortization (EMI)
  let monthlyPaymentMinor = 0;
  let totalPaymentsMinor = 0;
  let financeChargeMinor = 0;

  if (!isZeroFinanced) {
    const emiResult = calculateEmiSafe({
      amountFinancedMinor,
      annualRatePct: rate,
      termMonths,
    });
    monthlyPaymentMinor = emiResult.monthlyPaymentMinor;
    totalPaymentsMinor = monthlyPaymentMinor * termMonths;
    financeChargeMinor = Math.max(0, totalPaymentsMinor - amountFinancedMinor);
  }

  // 6. Contractor Buy-Down (if requested)
  let contractorBuyDownMinor = 0;
  let isBuyDownWithinCap = true;

  if (input.contractorBuyDownPct && input.contractorBuyDownPct > 0 && !isZeroFinanced) {
    // 5% max cap under regulatory rules
    const targetBuyDownMinor = Math.round(amountFinancedMinor * (input.contractorBuyDownPct / 100));
    const maxAllowedMinor = Math.round(amountFinancedMinor * 0.05);

    if (targetBuyDownMinor <= maxAllowedMinor) {
      contractorBuyDownMinor = targetBuyDownMinor;
      isBuyDownWithinCap = true;
    } else {
      contractorBuyDownMinor = maxAllowedMinor;
      isBuyDownWithinCap = false;
    }
  }

  // 7. Effective Net Customer Cost (factoring in down payment, payments, and post-install tax credits)
  // Effective cost = (clampedDownPayment + totalPayments) - (taxCredits + postInstallRebates)
  const effectiveNetCostMinor = Math.max(
    0,
    clampedDownPaymentMinor + totalPaymentsMinor - (taxCreditsMinor + postInstallRebatesMinor)
  );

  // 8. Generate Compliance Disclosures
  const posDeductionExplanation = posRebatesMinor > 0
    ? `Point-of-sale clean energy subsidy (e.g. PM Surya Ghar DBT / State Discom) of ₹${(posRebatesMinor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} deducted upfront from invoice.`
    : "No point-of-sale subsidies applied.";

  const taxCreditNotice = taxCreditsMinor > 0
    ? `Tax deductions / central clean energy incentives of ₹${(taxCreditsMinor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (e.g. Income Tax Section 80EEB) must be claimed on annual tax filings and do not reduce the immediate loan principal.`
    : "No post-installation tax incentives estimated.";

  return {
    grossPriceMinor,
    posRebatesMinor,
    taxCreditsMinor,
    postInstallRebatesMinor,
    totalIncentivesMinor,
    netInvoiceMinor,
    requestedDownPaymentMinor,
    clampedDownPaymentMinor,
    amountFinancedMinor,
    annualRatePct: rate,
    termMonths,
    monthlyPaymentMinor,
    totalPaymentsMinor,
    financeChargeMinor,
    contractorBuyDownMinor,
    isBuyDownWithinCap,
    effectiveNetCostMinor,
    disclosures: {
      posDeductionExplanation,
      taxCreditNotice,
      isZeroFinanced,
    },
  };
}
