import { calculateEmiSafe, calculateApr } from "./calculator.js";

export type IncentiveCategory =
  | "pm_surya_ghar_cfa"       // PM Surya Ghar Muft Bijli Yojana Central Financial Assistance (DBT)
  | "state_discom_subsidy"    // State nodal / SERC additional clean energy incentive
  | "pos_utility_rebate"      // Instant Point-of-Sale Utility Rebate -> deducted immediately
  | "federal_tax_credit"      // Claimed post-installation on tax return -> NEVER deducted at POS
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
 * PM Surya Ghar: Muft Bijli Yojana Central Financial Assistance (CFA) calculation.
 * 
 * Statutory formula under MNRE Guidelines:
 * CFA = min(kW, 2) × ₹30,000 + min(max(kW - 2, 0), 1) × ₹18,000
 * Maximum CFA = ₹78,000 for residential rooftop solar (cap at 3 kW).
 * 
 * Returns amount in minor units (paise).
 * e.g., 1 kW -> 30,000 * 100 = 3,000,000 paise (₹30,000)
 *       2 kW -> 60,000 * 100 = 6,000,000 paise (₹60,000)
 *       3 kW -> 78,000 * 100 = 7,800,000 paise (₹78,000)
 *       5 kW -> 78,000 * 100 = 7,800,000 paise (₹78,000, capped)
 *       0 kW or negative or invalid -> 0
 */
export function calculatePmSuryaGharCfa(capacityKw: number): {
  capacityKw: number;
  cfaAmountMinor: number;
  cfaAmountRupees: number;
  isCapped: boolean;
  tier1CfaMinor: number;
  tier2CfaMinor: number;
} {
  if (!Number.isFinite(capacityKw) || capacityKw <= 0) {
    return {
      capacityKw: 0,
      cfaAmountMinor: 0,
      cfaAmountRupees: 0,
      isCapped: false,
      tier1CfaMinor: 0,
      tier2CfaMinor: 0,
    };
  }

  // Tier 1: Up to 2 kW @ ₹30,000 / kW
  const tier1Kw = Math.min(capacityKw, 2);
  const tier1Rupees = tier1Kw * 30000;

  // Tier 2: Above 2 kW and up to 3 kW @ ₹18,000 / kW
  const tier2Kw = Math.min(Math.max(capacityKw - 2, 0), 1);
  const tier2Rupees = tier2Kw * 18000;

  const totalRupees = Math.min(78000, Math.round(tier1Rupees + tier2Rupees));
  const isCapped = capacityKw >= 3;

  return {
    capacityKw,
    cfaAmountMinor: totalRupees * 100,
    cfaAmountRupees: totalRupees,
    isCapped,
    tier1CfaMinor: Math.round(tier1Rupees * 100),
    tier2CfaMinor: Math.round(tier2Rupees * 100),
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
      if (
        inc.timing === "instant" &&
        (inc.category === "pos_utility_rebate" || inc.category === "pm_surya_ghar_cfa")
      ) {
        posRebatesMinor += amount;
      } else if (
        inc.category === "federal_tax_credit" ||
        inc.category === "state_tax_credit" ||
        inc.category === "state_discom_subsidy"
      ) {
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
    ? `State nodal clean energy incentives of ₹${(taxCreditsMinor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} must be claimed post-installation through DISCOM/nodal agencies and do not reduce the upfront point-of-sale invoice or immediate loan principal.`
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

/**
 * 2.1 Centralized Financial Calculation Engine - Authoritative Implementations
 */

/**
 * Sums line item amounts to determine total project price.
 */
export function calculateProjectPrice(lineItems: Array<{ amountMinor: number }>): number {
  if (!Array.isArray(lineItems) || lineItems.length === 0) return 0;
  let total = 0;
  for (const item of lineItems) {
    if (!Number.isFinite(item.amountMinor)) {
      throw new Error("Line item amount must be a finite number.");
    }
    if (item.amountMinor < 0) {
      throw new Error("Line item amount cannot be negative.");
    }
    total += Math.round(item.amountMinor);
  }
  return total;
}

/**
 * Classifies and aggregates eligible incentives by payment timing and category.
 */
export function calculateEligibleIncentives(incentives?: IncentiveItem[]): {
  upfrontRebatesMinor: number;
  futureTaxCreditsMinor: number;
  postInstallMinor: number;
  totalIncentivesMinor: number;
} {
  let upfrontRebatesMinor = 0;
  let futureTaxCreditsMinor = 0;
  let postInstallMinor = 0;

  if (incentives && Array.isArray(incentives)) {
    for (const inc of incentives) {
      const amount = Math.max(0, Math.round(inc.amountMinor || 0));
      if (
        inc.timing === "instant" &&
        (inc.category === "pos_utility_rebate" || inc.category === "pm_surya_ghar_cfa")
      ) {
        upfrontRebatesMinor += amount;
      } else if (
        inc.category === "federal_tax_credit" ||
        inc.category === "state_tax_credit" ||
        inc.category === "state_discom_subsidy"
      ) {
        futureTaxCreditsMinor += amount;
      } else {
        postInstallMinor += amount;
      }
    }
  }

  return {
    upfrontRebatesMinor,
    futureTaxCreditsMinor,
    postInstallMinor,
    totalIncentivesMinor: upfrontRebatesMinor + futureTaxCreditsMinor + postInstallMinor,
  };
}

/**
 * Calculates upfront instant point-of-sale rebates, clamped to project price.
 */
export function calculateUpfrontRebates(incentives?: IncentiveItem[], projectPriceMinor?: number): number {
  const { upfrontRebatesMinor } = calculateEligibleIncentives(incentives);
  if (projectPriceMinor !== undefined) {
    return Math.min(Math.max(0, projectPriceMinor), upfrontRebatesMinor);
  }
  return upfrontRebatesMinor;
}

/**
 * Calculates future tax credits and post-commissioning incentives (never deducted upfront).
 */
export function calculateFutureTaxCredits(incentives?: IncentiveItem[]): number {
  const { futureTaxCreditsMinor } = calculateEligibleIncentives(incentives);
  return futureTaxCreditsMinor;
}

/**
 * Calculates down payment, clamping to ensure it does not exceed net invoice.
 */
export function calculateDownPayment(
  requestedDownPaymentMinor: number,
  netInvoiceMinor: number,
  minFinancedMinor: number = 0
): { requestedMinor: number; clampedMinor: number; maxAllowedMinor: number } {
  const requested = Math.max(0, Math.round(requestedDownPaymentMinor || 0));
  const netInvoice = Math.max(0, Math.round(netInvoiceMinor || 0));
  const maxAllowedMinor = Math.max(0, netInvoice - minFinancedMinor);
  const clampedMinor = Math.min(requested, maxAllowedMinor);

  return {
    requestedMinor: requested,
    clampedMinor,
    maxAllowedMinor,
  };
}

/**
 * Authoritative calculation of Amount Financed:
 * Amount Financed = Project Price - Eligible Upfront Rebates - Customer Down Payment + Applicable Financed Fees
 * 
 * Rules:
 * - A future tax credit must not automatically be deducted from the amount financed.
 * - Negative project price produces validation failure (throws Error).
 * - Upfront rebate exceeding project price produces validation failure (throws Error).
 */
export function calculateAmountFinanced(
  projectPriceMinor: number,
  upfrontRebatesMinor: number,
  downPaymentMinor: number,
  financedFeesMinor: number = 0
): number {
  if (!Number.isFinite(projectPriceMinor) || projectPriceMinor < 0) {
    throw new Error("Project price must be non-negative.");
  }
  if (!Number.isFinite(upfrontRebatesMinor) || upfrontRebatesMinor < 0) {
    throw new Error("Upfront rebates cannot be negative.");
  }
  if (!Number.isFinite(downPaymentMinor) || downPaymentMinor < 0) {
    throw new Error("Down payment cannot be negative.");
  }

  // Explicit business rule validation: Subsidy greater than project price
  if (upfrontRebatesMinor > projectPriceMinor) {
    throw new Error("Upfront subsidies cannot exceed total project price.");
  }

  const netInvoice = projectPriceMinor - upfrontRebatesMinor;
  if (downPaymentMinor > netInvoice) {
    throw new Error("Down payment cannot exceed net invoice amount.");
  }

  const fees = Math.max(0, Math.round(financedFeesMinor || 0));
  const amountFinanced = (netInvoice - downPaymentMinor) + fees;

  return Math.max(0, Math.round(amountFinanced));
}

/**
 * Validates contractor rate buy-down and enforces the 5% regulatory cap.
 */
export function validateBuyDown(
  amountFinancedMinor: number,
  requestedBuyDownMinor: number,
  maxCapPct: number = 5
): { isWithinCap: boolean; maxAllowedMinor: number; clampedMinor: number } {
  const maxAllowedMinor = Math.floor(Math.max(0, amountFinancedMinor) * (maxCapPct / 100));
  const requested = Math.max(0, Math.round(requestedBuyDownMinor || 0));
  const isWithinCap = requested <= maxAllowedMinor;
  const clampedMinor = isWithinCap ? requested : maxAllowedMinor;

  return {
    isWithinCap,
    maxAllowedMinor,
    clampedMinor,
  };
}

/**
 * Subsidy Treatment Models for Indian Clean Energy Lending:
 * 
 * 1. "gross_financing_future_receipt":
 *    Loan covers entire gross balance (Gross Price - Down Payment).
 *    Homeowner receives CFA directly in bank account post-inspection/commissioning.
 * 
 * 2. "subsidy_part_prepayment":
 *    Loan initially finances (Gross Price - Down Payment).
 *    When CFA is credited to borrower's account, it is applied as a part-prepayment,
 *    reducing remaining principal, tenure, or monthly EMI without penalty.
 * 
 * 3. "bridge_financing":
 *    Optional bank/lender-dependent bridge loan covering the upfront subsidy portion
 *    pending DBT release, clearly marked as a lender-specific capability.
 */
export type SubsidyFinancingTreatment =
  | "gross_financing_future_receipt"
  | "subsidy_part_prepayment"
  | "bridge_financing";

export interface IndianSolarLoanBreakdownInput {
  grossProjectPriceMinor: number;
  solarCapacityKw: number;
  downPaymentMinor: number;
  annualRatePct: number;
  termMonths: number;
  processingFeePct?: number; // e.g. 1.0% processing fee
  gstPctOnFees?: number;     // e.g. 18.0% GST on banking fees
  treatment?: SubsidyFinancingTreatment;
}

export interface IndianSolarLoanBreakdownResult {
  grossProjectPriceMinor: number;
  solarCapacityKw: number;
  eligibleCfaMinor: number;
  eligibleCfaRupees: number;
  
  // Down payment & Principal
  requestedDownPaymentMinor: number;
  clampedDownPaymentMinor: number;
  
  // Fees & GST
  processingFeeRatePct: number;
  baseProcessingFeeMinor: number;
  gstOnProcessingFeeMinor: number;
  totalUpfrontBankingChargesMinor: number;
  
  // Loan Amounts based on treatment
  treatment: SubsidyFinancingTreatment;
  initialPrincipalMinor: number;
  
  // Amortization & Repayment
  annualRatePct: number;
  termMonths: number;
  monthlyEmiMinor: number;
  totalRepaymentMinor: number;
  totalInterestMinor: number;
  totalCostOfCreditMinor: number; // totalRepayment + totalUpfrontBankingCharges
  
  // All-in APR including processing fee & 18% GST
  nominalRatePct: number;
  allInAprPct: number;
  
  // Subsidy Post-Credit Simulation (for subsidy_part_prepayment)
  postSubsidyPrincipalMinor: number;
  postSubsidyMonthlyEmiMinor: number;
  postSubsidyInterestSavingsMinor: number;
}

export function calculateIndianSolarFinancing(
  input: IndianSolarLoanBreakdownInput
): IndianSolarLoanBreakdownResult {
  const grossPrice = Math.max(0, Math.round(input.grossProjectPriceMinor || 0));
  const cfa = calculatePmSuryaGharCfa(input.solarCapacityKw);
  const eligibleCfaMinor = cfa.cfaAmountMinor;
  
  const treatment = input.treatment || "gross_financing_future_receipt";
  const requestedDownPayment = Math.max(0, Math.round(input.downPaymentMinor || 0));
  const clampedDownPayment = Math.min(requestedDownPayment, grossPrice);
  
  // Under Indian banking standards, primary loan finances (Gross - DownPayment)
  // For bridge_financing, upfront subsidy is bridged by the lender
  let initialPrincipalMinor: number;
  if (treatment === "bridge_financing") {
    const netAfterSubsidy = Math.max(0, grossPrice - eligibleCfaMinor);
    initialPrincipalMinor = Math.max(0, netAfterSubsidy - Math.min(clampedDownPayment, netAfterSubsidy));
  } else {
    // Gross financing / Part prepayment
    initialPrincipalMinor = Math.max(0, grossPrice - clampedDownPayment);
  }

  // Fees and GST (18% on financial services under Indian GST)
  const feePct = input.processingFeePct !== undefined ? Math.max(0, input.processingFeePct) : 1.0; // default 1%
  const gstPct = input.gstPctOnFees !== undefined ? Math.max(0, input.gstPctOnFees) : 18.0;       // default 18%
  
  const baseProcessingFeeMinor = Math.round(initialPrincipalMinor * (feePct / 100));
  const gstOnProcessingFeeMinor = Math.round(baseProcessingFeeMinor * (gstPct / 100));
  const totalUpfrontBankingChargesMinor = baseProcessingFeeMinor + gstOnProcessingFeeMinor;

  // EMI & Repayment
  const rate = Math.max(0, Number(input.annualRatePct) || 0);
  const term = Math.max(1, Math.round(input.termMonths || 60));
  
  const emiResult = calculateEmiSafe({
    amountFinancedMinor: initialPrincipalMinor,
    annualRatePct: rate,
    termMonths: term,
  });

  const monthlyEmiMinor = emiResult.monthlyPaymentMinor;
  const totalRepaymentMinor = emiResult.totalRepaymentMinor;
  const totalInterestMinor = emiResult.totalInterestMinor;
  const totalCostOfCreditMinor = totalRepaymentMinor + totalUpfrontBankingChargesMinor;

  // Actuarial All-In APR calculation including prepaid finance charges (Fee + GST)
  const allInAprPct = calculateApr(
    initialPrincipalMinor,
    monthlyEmiMinor,
    term,
    totalUpfrontBankingChargesMinor
  );

  // Post-Subsidy Prepayment Simulation
  const postSubsidyPrincipalMinor = Math.max(0, initialPrincipalMinor - eligibleCfaMinor);
  let postSubsidyMonthlyEmiMinor = 0;
  let postSubsidyInterestSavingsMinor = 0;
  
  if (postSubsidyPrincipalMinor > 0 && initialPrincipalMinor > 0) {
    const postEmi = calculateEmiSafe({
      amountFinancedMinor: postSubsidyPrincipalMinor,
      annualRatePct: rate,
      termMonths: term,
    });
    postSubsidyMonthlyEmiMinor = postEmi.monthlyPaymentMinor;
    postSubsidyInterestSavingsMinor = Math.max(0, totalInterestMinor - postEmi.totalInterestMinor);
  }

  return {
    grossProjectPriceMinor: grossPrice,
    solarCapacityKw: input.solarCapacityKw,
    eligibleCfaMinor,
    eligibleCfaRupees: cfa.cfaAmountRupees,
    requestedDownPaymentMinor: requestedDownPayment,
    clampedDownPaymentMinor: clampedDownPayment,
    processingFeeRatePct: feePct,
    baseProcessingFeeMinor,
    gstOnProcessingFeeMinor,
    totalUpfrontBankingChargesMinor,
    treatment,
    initialPrincipalMinor,
    annualRatePct: rate,
    termMonths: term,
    monthlyEmiMinor,
    totalRepaymentMinor,
    totalInterestMinor,
    totalCostOfCreditMinor,
    nominalRatePct: rate,
    allInAprPct,
    postSubsidyPrincipalMinor,
    postSubsidyMonthlyEmiMinor,
    postSubsidyInterestSavingsMinor,
  };
}
