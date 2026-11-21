/**
 * @greenquote/shared - Financial Calculation Engine
 * 
 * Strict compliance rules:
 * 1. Zero floating point currency values - all amounts are integers in smallest units (cents/paise).
 * 2. Deterministic rounding (half-up to nearest minor unit).
 * 3. Exact implementation of standard annuity formula for EMI:
 *    EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 * 4. Contractor buy-down strictly capped at 5% of amount financed (FR-603).
 * 5. TILA trigger term compliance (CMP-01).
 */

export interface EmiCalculationInput {
  amountFinancedMinor: number; // Principal in minor units (cents or paise)
  annualRatePct: number;       // e.g. 5.75 for 5.75%
  termMonths: number;          // e.g. 60
}

export interface EmiCalculationResult {
  amountFinancedMinor: number;
  annualRatePct: number;
  termMonths: number;
  monthlyPaymentMinor: number;
  totalRepaymentMinor: number;
  totalInterestMinor: number;
}

export interface BuyDownCalculationInput {
  amountFinancedMinor: number;
  originalRatePct: number;
  targetRatePct: number;
  termMonths: number;
}

export interface BuyDownCalculationResult {
  amountFinancedMinor: number;
  originalRatePct: number;
  targetRatePct: number;
  termMonths: number;
  originalMonthlyPaymentMinor: number;
  newMonthlyPaymentMinor: number;
  monthlySavingsMinor: number;
  contractorBuyDownCostMinor: number;
  maxAllowedBuyDownMinor: number; // 5% cap
  isWithinCap: boolean;
}

export interface AmortizationRow {
  month: number;
  paymentMinor: number;
  principalMinor: number;
  interestMinor: number;
  remainingBalanceMinor: number;
}

/**
 * Calculates the Equated Monthly Installment (EMI) using the standard annuity formula.
 * Rounds to the nearest whole minor unit using half-up rounding.
 */
export function calculateEmi(input: EmiCalculationInput): EmiCalculationResult {
  const { amountFinancedMinor, annualRatePct, termMonths } = input;

  if (amountFinancedMinor <= 0) {
    throw new Error("Amount financed must be greater than zero.");
  }
  if (termMonths <= 0 || !Number.isInteger(termMonths)) {
    throw new Error("Term in months must be a positive integer.");
  }
  if (annualRatePct < 0) {
    throw new Error("Annual rate percentage cannot be negative.");
  }

  // 0% APR case
  if (annualRatePct === 0) {
    const monthlyPaymentMinor = Math.round(amountFinancedMinor / termMonths);
    const totalRepaymentMinor = monthlyPaymentMinor * termMonths;
    return {
      amountFinancedMinor,
      annualRatePct: 0,
      termMonths,
      monthlyPaymentMinor,
      totalRepaymentMinor,
      totalInterestMinor: 0,
    };
  }

  const monthlyRate = annualRatePct / (12 * 100);
  const factor = Math.pow(1 + monthlyRate, termMonths);
  const emiExact = (amountFinancedMinor * monthlyRate * factor) / (factor - 1);
  const monthlyPaymentMinor = Math.round(emiExact);
  const totalRepaymentMinor = monthlyPaymentMinor * termMonths;
  const totalInterestMinor = totalRepaymentMinor - amountFinancedMinor;

  return {
    amountFinancedMinor,
    annualRatePct,
    termMonths,
    monthlyPaymentMinor,
    totalRepaymentMinor,
    totalInterestMinor: Math.max(0, totalInterestMinor),
  };
}

/**
 * Calculates contractor rate buy-down and validates the 5% regulatory cap (FR-603 / CMP-12).
 * Buy-down cost is the net present value of monthly rate reductions funded upfront by the contractor.
 */
export function calculateBuyDown(input: BuyDownCalculationInput): BuyDownCalculationResult {
  const { amountFinancedMinor, originalRatePct, targetRatePct, termMonths } = input;

  if (targetRatePct > originalRatePct) {
    throw new Error("Target rate cannot be higher than original rate for a buy-down.");
  }

  const origCalc = calculateEmi({
    amountFinancedMinor,
    annualRatePct: originalRatePct,
    termMonths,
  });

  const targetCalc = calculateEmi({
    amountFinancedMinor,
    annualRatePct: targetRatePct,
    termMonths,
  });

  const monthlySavingsMinor = origCalc.monthlyPaymentMinor - targetCalc.monthlyPaymentMinor;
  
  // Approximate present value cost to buy down the rate:
  // PV = sum(monthlySavings / (1 + monthlyRate)^t)
  const monthlyDiscountRate = targetRatePct / (12 * 100);
  let buyDownCostExact = 0;
  for (let t = 1; t <= termMonths; t++) {
    buyDownCostExact += monthlySavingsMinor / Math.pow(1 + monthlyDiscountRate, t);
  }
  const contractorBuyDownCostMinor = Math.round(buyDownCostExact);

  // Maximum allowed buy-down is strictly 5% of amount financed
  const maxAllowedBuyDownMinor = Math.floor(amountFinancedMinor * 0.05);
  const isWithinCap = contractorBuyDownCostMinor <= maxAllowedBuyDownMinor;

  return {
    amountFinancedMinor,
    originalRatePct,
    targetRatePct,
    termMonths,
    originalMonthlyPaymentMinor: origCalc.monthlyPaymentMinor,
    newMonthlyPaymentMinor: targetCalc.monthlyPaymentMinor,
    monthlySavingsMinor,
    contractorBuyDownCostMinor,
    maxAllowedBuyDownMinor,
    isWithinCap,
  };
}

/**
 * Generates month-by-month amortization schedule for loan disclosures and transparency.
 */
export function generateAmortizationSchedule(input: EmiCalculationInput): AmortizationRow[] {
  const { amountFinancedMinor, annualRatePct, termMonths } = input;
  const { monthlyPaymentMinor } = calculateEmi(input);
  const monthlyRate = annualRatePct / (12 * 100);

  let balance = amountFinancedMinor;
  const schedule: AmortizationRow[] = [];

  for (let month = 1; month <= termMonths; month++) {
    const interestExact = balance * monthlyRate;
    let interestMinor = Math.round(interestExact);
    let principalMinor = monthlyPaymentMinor - interestMinor;

    // Final month adjustment for rounding accuracy
    if (month === termMonths || principalMinor > balance) {
      principalMinor = balance;
      interestMinor = monthlyPaymentMinor - principalMinor;
      balance = 0;
    } else {
      balance -= principalMinor;
    }

    schedule.push({
      month,
      paymentMinor: principalMinor + interestMinor,
      principalMinor,
      interestMinor: Math.max(0, interestMinor),
      remainingBalanceMinor: Math.max(0, balance),
    });

    if (balance === 0) break;
  }

  return schedule;
}

/**
 * Calculates effective Annual Percentage Rate (APR) based on TILA Regulation Z (§1026.22)
 * using the actuarial method including prepaid finance charges (fees).
 */
export function calculateApr(
  amountFinancedMinor: number,
  monthlyPaymentMinor: number,
  termMonths: number,
  prepaidFinanceChargeMinor: number = 0
): number {
  if (termMonths <= 0) return 0;
  
  const netProceeds = amountFinancedMinor - prepaidFinanceChargeMinor;
  if (netProceeds <= 0) return 0;

  // Newton-Raphson method to solve for monthly rate r:
  // f(r) = Payment * (1 - (1+r)^-n) / r - netProceeds = 0
  let r = (monthlyPaymentMinor * termMonths - netProceeds) / (netProceeds * termMonths);
  if (r <= 0) r = 0.001;

  for (let iter = 0; iter < 100; iter++) {
    const factor = Math.pow(1 + r, -termMonths);
    const f = (monthlyPaymentMinor * (1 - factor)) / r - netProceeds;
    const fPrime = (monthlyPaymentMinor * (termMonths * r * Math.pow(1 + r, -termMonths - 1) - (1 - factor))) / (r * r);
    
    const rNext = r - f / fPrime;
    if (Math.abs(rNext - r) < 1e-7) {
      r = rNext;
      break;
    }
    r = rNext;
  }

  const aprPct = r * 12 * 100;
  return Math.round(aprPct * 100) / 100; // Round to 2 decimal places
}

/**
 * Format minor units into human readable currency string with proper localization.
 */
export function formatCurrency(amountMinor: number, currency: "USD" | "INR" = "USD"): string {
  const major = amountMinor / 100;
  if (currency === "INR") {
    // Indian numbering format (e.g. ₹2,00,000)
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(major);
  }

  // Standard USD format (e.g. $10,000)
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(major);
}
