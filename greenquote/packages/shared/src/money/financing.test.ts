import {
  calculateFinancingBreakdown,
  validateFinancingInput,
  FinancingCalculationInput,
} from "./financing.js";

describe("Centralized Financial Calculation Engine", () => {
  describe("The Better Package Discrepancy Resolution", () => {
    it("correctly deducts instant POS utility rebate upfront before applying down payment", () => {
      // Scenario from Product Audit:
      // Cash price: $15,400 (1,540,000 minor)
      // Mass Save instant utility rebate: $10,000 (1,000,000 minor)
      // Down payment: $2,000 (200,000 minor)
      const input: FinancingCalculationInput = {
        grossPriceMinor: 1540000,
        downPaymentMinor: 200000,
        incentives: [
          {
            id: "inc_mass_save",
            name: "Mass Save Whole-Home Heat Pump Rebate",
            amountMinor: 1000000,
            category: "pos_utility_rebate",
            timing: "instant",
          },
        ],
        annualRatePct: 6.99,
        termMonths: 60,
      };

      const result = calculateFinancingBreakdown(input);

      // Verify POS Rebates
      expect(result.grossPriceMinor).toBe(1540000); // $15,400
      expect(result.posRebatesMinor).toBe(1000000); // $10,000
      expect(result.taxCreditsMinor).toBe(0);

      // Net invoice at POS = $15,400 - $10,000 = $5,400 (540,000 minor)
      expect(result.netInvoiceMinor).toBe(540000);

      // Clamped down payment = $2,000 (200,000 minor)
      expect(result.clampedDownPaymentMinor).toBe(200000);

      // Amount Financed = $5,400 - $2,000 = $3,400 (340,000 minor)
      // MUST NOT be $13,400!
      expect(result.amountFinancedMinor).toBe(340000);

      // Actuarial EMI verification for $3,400 at 6.99% for 60 months:
      // Monthly periodic rate r = 0.0699 / 12 = 0.005825
      // Deterministic half-up rounding yields 6,731 minor ($67.31/mo)
      expect(result.monthlyPaymentMinor).toBe(6731);
      expect(result.totalPaymentsMinor).toBe(6731 * 60); // 403,860 minor ($4,038.60)
      expect(result.financeChargeMinor).toBe(403860 - 340000); // 63,860 minor ($638.60)

      expect(result.disclosures.isZeroFinanced).toBe(false);
      expect(result.disclosures.posDeductionExplanation).toContain("10,000.00");
    });
  });

  describe("Rule: Never Treat Future Tax Credit as Immediate POS Rebate", () => {
    it("does NOT deduct federal tax credits from the POS invoice or loan principal", () => {
      // Scenario:
      // Gross price: $15,400 (1,540,000 minor)
      // Clean Energy Tax Incentive / Section 80EEB: 200,000 minor claimed on tax return
      // Down payment: 200,000 minor
      const input: FinancingCalculationInput = {
        grossPriceMinor: 1540000,
        downPaymentMinor: 200000,
        incentives: [
          {
            id: "inc_tax_deduction",
            name: "Section 80EEB Green Tax Deduction",
            amountMinor: 200000,
            category: "federal_tax_credit",
            timing: "after_installation",
          },
        ],
        annualRatePct: 6.99,
        termMonths: 60,
      };

      const result = calculateFinancingBreakdown(input);

      // POS Rebate is 0 - tax credit cannot reduce invoice
      expect(result.posRebatesMinor).toBe(0);
      expect(result.taxCreditsMinor).toBe(200000);

      // Net invoice remains full gross price: 1,540,000
      expect(result.netInvoiceMinor).toBe(1540000);

      // Amount financed is 1,540,000 - 200,000 down payment = 1,340,000
      expect(result.amountFinancedMinor).toBe(1340000);

      // Tax credit notice is generated
      expect(result.disclosures.taxCreditNotice).toContain("Section 80EEB");
      expect(result.disclosures.taxCreditNotice).toContain("do not reduce the immediate loan principal");

      // Lifetime effective cost properly incorporates the $2,000 tax credit refund
      // Effective cost = down payment + total payments - tax credit
      const expectedEffectiveCost = 200000 + result.totalPaymentsMinor - 200000;
      expect(result.effectiveNetCostMinor).toBe(expectedEffectiveCost);
    });
  });

  describe("Combined In-Flight Stacking (POS Rebate + Tax Credit)", () => {
    it("stacks POS rebate upfront while leaving tax credit for tax season", () => {
      const input: FinancingCalculationInput = {
        grossPriceMinor: 2000000, // $20,000
        downPaymentMinor: 100000,  // $1,000
        incentives: [
          {
            id: "inc_utility",
            name: "Electric Utility Instant Rebate",
            amountMinor: 400000, // $4,000 POS
            category: "pos_utility_rebate",
            timing: "instant",
          },
          {
            id: "inc_ira_25c",
            name: "IRA Section 25C",
            amountMinor: 200000, // $2,000 tax credit
            category: "federal_tax_credit",
            timing: "after_installation",
          },
        ],
        annualRatePct: 7.99,
        termMonths: 84,
      };

      const result = calculateFinancingBreakdown(input);

      expect(result.grossPriceMinor).toBe(2000000);
      expect(result.posRebatesMinor).toBe(400000);
      expect(result.taxCreditsMinor).toBe(200000);
      expect(result.totalIncentivesMinor).toBe(600000);

      // Net Invoice = $20,000 - $4,000 = $16,000
      expect(result.netInvoiceMinor).toBe(1600000);

      // Amount Financed = $16,000 - $1,000 = $15,000
      expect(result.amountFinancedMinor).toBe(1500000);
      expect(result.monthlyPaymentMinor).toBeGreaterThan(0);
    });
  });

  describe("Zero-Financed and Over-Payment Guardrails", () => {
    it("handles 100% cash down payment cleanly without throwing", () => {
      const input: FinancingCalculationInput = {
        grossPriceMinor: 1000000, // $10,000
        downPaymentMinor: 1000000, // $10,000 (100% down)
        annualRatePct: 7.99,
        termMonths: 60,
      };

      const result = calculateFinancingBreakdown(input);

      expect(result.amountFinancedMinor).toBe(0);
      expect(result.monthlyPaymentMinor).toBe(0);
      expect(result.totalPaymentsMinor).toBe(0);
      expect(result.financeChargeMinor).toBe(0);
      expect(result.disclosures.isZeroFinanced).toBe(true);
    });

    it("clamps excessive down payment to net invoice", () => {
      const input: FinancingCalculationInput = {
        grossPriceMinor: 1000000, // $10,000
        downPaymentMinor: 1500000, // $15,000 requested (exceeds invoice)
        annualRatePct: 7.99,
        termMonths: 60,
      };

      const result = calculateFinancingBreakdown(input);

      expect(result.clampedDownPaymentMinor).toBe(1000000);
      expect(result.amountFinancedMinor).toBe(0);
      expect(result.monthlyPaymentMinor).toBe(0);
    });
  });

  describe("Contractor Buy-Down Enforcement", () => {
    it("enforces the 5% regulatory cap on contractor buy-downs (FR-603)", () => {
      const inputWithinCap: FinancingCalculationInput = {
        grossPriceMinor: 1000000, // $10,000
        downPaymentMinor: 0,
        annualRatePct: 7.99,
        termMonths: 60,
        contractorBuyDownPct: 3.2, // 3.2% (under 5% cap)
      };

      const resWithin = calculateFinancingBreakdown(inputWithinCap);
      expect(resWithin.contractorBuyDownMinor).toBe(32000); // $320
      expect(resWithin.isBuyDownWithinCap).toBe(true);

      const inputExceedingCap: FinancingCalculationInput = {
        grossPriceMinor: 1000000, // $10,000
        downPaymentMinor: 0,
        annualRatePct: 7.99,
        termMonths: 60,
        contractorBuyDownPct: 8.0, // 8.0% (exceeds 5% cap)
      };

      const resExceeding = calculateFinancingBreakdown(inputExceedingCap);
      expect(resExceeding.contractorBuyDownMinor).toBe(50000); // Clamped to 5% ($500)
      expect(resExceeding.isBuyDownWithinCap).toBe(false);
    });
  });

  describe("Server-Side Input Validation", () => {
    it("flags regulatory violation when tax credit is configured as instant POS deduction", () => {
      const input: FinancingCalculationInput = {
        grossPriceMinor: 1000000,
        downPaymentMinor: 100000,
        incentives: [
          {
            id: "bad_ira_credit",
            name: "IRA 25C Tax Credit",
            amountMinor: 200000,
            category: "federal_tax_credit",
            timing: "instant", // INVALID: Tax credit cannot be instant POS deduction
          },
        ],
        annualRatePct: 7.99,
        termMonths: 60,
      };

      const errors = validateFinancingInput(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.message).toContain("cannot be applied as an instant point-of-sale deduction");
    });

    it("validates positive price, terms, and non-negative rates", () => {
      const errors = validateFinancingInput({
        grossPriceMinor: -100,
        downPaymentMinor: -50,
        annualRatePct: -2,
        termMonths: 0,
      });

      expect(errors.some((e) => e.field === "grossPriceMinor")).toBe(true);
      expect(errors.some((e) => e.field === "downPaymentMinor")).toBe(true);
      expect(errors.some((e) => e.field === "annualRatePct")).toBe(true);
      expect(errors.some((e) => e.field === "termMonths")).toBe(true);
    });
  });
});
