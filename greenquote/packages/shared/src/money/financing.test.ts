import {
  calculateFinancingBreakdown,
  validateFinancingInput,
  calculateProjectPrice,
  calculateEligibleIncentives,
  calculateUpfrontRebates,
  calculateFutureTaxCredits,
  calculateDownPayment,
  calculateAmountFinanced,
  validateBuyDown,
  FinancingCalculationInput,
} from "./financing.js";
import {
  calculateMonthlyEMI,
  calculateTotalRepayment,
  calculateTotalInterest,
  calculateAPRDisclosure,
} from "./calculator.js";

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
    it("does NOT deduct post-installation tax/state credits from the POS invoice or loan principal", () => {
      // Scenario:
      // Gross price: ₹2,20,000 (22,000,000 minor)
      // Clean Energy State Nodal Incentive: 2,000,000 minor claimed post-commissioning
      // Down payment: 2,000,000 minor
      const input: FinancingCalculationInput = {
        grossPriceMinor: 22000000,
        downPaymentMinor: 2000000,
        incentives: [
          {
            id: "inc_state_nodal",
            name: "State DISCOM Clean Energy Post-Install Incentive",
            amountMinor: 2000000,
            category: "federal_tax_credit",
            timing: "after_installation",
          },
        ],
        annualRatePct: 7.00,
        termMonths: 60,
      };

      const result = calculateFinancingBreakdown(input);

      // POS Rebate is 0 - post-install credit cannot reduce invoice
      expect(result.posRebatesMinor).toBe(0);
      expect(result.taxCreditsMinor).toBe(2000000);

      // Net invoice remains full gross price: 22,000,000
      expect(result.netInvoiceMinor).toBe(22000000);

      // Amount financed is 22,000,000 - 2,000,000 down payment = 20,000,000
      expect(result.amountFinancedMinor).toBe(20000000);

      // Post-install notice is generated without misleading Section 80EEB classification
      expect(result.disclosures.taxCreditNotice).toContain("State nodal clean energy incentives");
      expect(result.disclosures.taxCreditNotice).toContain("do not reduce the upfront point-of-sale invoice");

      // Lifetime effective cost properly incorporates the incentive
      // Effective cost = down payment + total payments - incentive
      const expectedEffectiveCost = 2000000 + result.totalPaymentsMinor - 2000000;
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

  describe("Phase 2.4 Mandatory Financial Test Cases (Tests A through G)", () => {
    // Test A: Project price: ₹2,20,000 | Upfront subsidy: ₹78,000 | Down payment: ₹20,000 -> Expected: ₹1,22,000
    it("Test A: computes amount financed for ₹2,20,000 with ₹78,000 subsidy and ₹20,000 down payment", () => {
      const projectPrice = 22000000; // ₹2,20,000
      const upfrontSubsidy = 7800000; // ₹78,000
      const downPayment = 2000000;    // ₹20,000

      const amountFinanced = calculateAmountFinanced(projectPrice, upfrontSubsidy, downPayment);
      expect(amountFinanced).toBe(12200000); // Exactly ₹1,22,000 (12,200,000 paise)

      // Also verify via full breakdown
      const breakdown = calculateFinancingBreakdown({
        grossPriceMinor: projectPrice,
        downPaymentMinor: downPayment,
        incentives: [
          {
            id: "pm_surya_ghar",
            name: "PM Surya Ghar 3kW Subsidy",
            amountMinor: upfrontSubsidy,
            category: "pos_utility_rebate",
            timing: "instant",
          },
        ],
        annualRatePct: 7.0,
        termMonths: 60,
      });
      expect(breakdown.amountFinancedMinor).toBe(12200000);
      expect(breakdown.netInvoiceMinor).toBe(14200000);
      expect(breakdown.clampedDownPaymentMinor).toBe(2000000);
    });

    // Test B: Project price: ₹2,20,000 | Upfront subsidy: ₹78,000 | Down payment: ₹0 -> Expected: ₹1,42,000
    it("Test B: computes amount financed for ₹2,20,000 with ₹78,000 subsidy and ₹0 down payment", () => {
      const projectPrice = 22000000; // ₹2,20,000
      const upfrontSubsidy = 7800000; // ₹78,000
      const downPayment = 0;

      const amountFinanced = calculateAmountFinanced(projectPrice, upfrontSubsidy, downPayment);
      expect(amountFinanced).toBe(14200000); // Exactly ₹1,42,000 (14,200,000 paise)

      const breakdown = calculateFinancingBreakdown({
        grossPriceMinor: projectPrice,
        downPaymentMinor: downPayment,
        incentives: [
          {
            id: "pm_surya_ghar",
            name: "PM Surya Ghar 3kW Subsidy",
            amountMinor: upfrontSubsidy,
            category: "pos_utility_rebate",
            timing: "instant",
          },
        ],
        annualRatePct: 7.0,
        termMonths: 60,
      });
      expect(breakdown.amountFinancedMinor).toBe(14200000);
    });

    // Test C: Project price: ₹1,00,000 | Upfront subsidy: ₹20,000 | Down payment: ₹80,000 -> Expected: ₹0
    it("Test C: computes amount financed for ₹1,00,000 with ₹20,000 subsidy and ₹80,000 down payment", () => {
      const projectPrice = 10000000; // ₹1,00,000
      const upfrontSubsidy = 2000000; // ₹20,000
      const downPayment = 8000000;    // ₹80,000

      const amountFinanced = calculateAmountFinanced(projectPrice, upfrontSubsidy, downPayment);
      expect(amountFinanced).toBe(0); // Exactly ₹0 financed

      const breakdown = calculateFinancingBreakdown({
        grossPriceMinor: projectPrice,
        downPaymentMinor: downPayment,
        incentives: [
          {
            id: "pm_surya_ghar_1kw",
            name: "PM Surya Ghar 1kW Subsidy",
            amountMinor: upfrontSubsidy,
            category: "pos_utility_rebate",
            timing: "instant",
          },
        ],
        annualRatePct: 7.0,
        termMonths: 60,
      });
      expect(breakdown.amountFinancedMinor).toBe(0);
      expect(breakdown.monthlyPaymentMinor).toBe(0);
      expect(breakdown.disclosures.isZeroFinanced).toBe(true);
    });

    // Test D: Future tax credit: ₹30,000 | Project price: ₹2,00,000 | Down payment: ₹20,000 -> Expected: ₹1,80,000
    it("Test D: future tax credit of ₹30,000 is NOT deducted upfront from ₹2,00,000 price and ₹20,000 down payment", () => {
      const projectPrice = 20000000;   // ₹2,00,000
      const futureTaxCredit = 3000000; // ₹30,000 (future post-commissioning credit)
      const downPayment = 2000000;     // ₹20,000

      // Upfront subsidy is 0 because future tax credits must NOT be deducted at POS
      const amountFinanced = calculateAmountFinanced(projectPrice, 0, downPayment);
      expect(amountFinanced).toBe(18000000); // Exactly ₹1,80,000 (18,000,000 paise)

      const breakdown = calculateFinancingBreakdown({
        grossPriceMinor: projectPrice,
        downPaymentMinor: downPayment,
        incentives: [
          {
            id: "future_nodal_credit",
            name: "State DISCOM Clean Energy Post-Install Credit",
            amountMinor: futureTaxCredit,
            category: "state_tax_credit",
            timing: "after_installation",
          },
        ],
        annualRatePct: 7.0,
        termMonths: 60,
      });

      // Amount financed MUST remain ₹1,80,000, NOT ₹1,50,000!
      expect(breakdown.amountFinancedMinor).toBe(18000000);
      expect(breakdown.posRebatesMinor).toBe(0);
      expect(breakdown.taxCreditsMinor).toBe(3000000);
    });

    // Test E: Negative project price -> Validation failure
    it("Test E: rejects negative project price with validation error", () => {
      expect(() => calculateAmountFinanced(-100000, 0, 0)).toThrow("Project price must be non-negative.");
      
      const validationErrors = validateFinancingInput({
        grossPriceMinor: -2000000,
        downPaymentMinor: 0,
        annualRatePct: 7.0,
        termMonths: 60,
      });
      expect(validationErrors.some((e) => e.field === "grossPriceMinor")).toBe(true);
    });

    // Test F: Subsidy greater than project price -> Explicit business rule validation
    it("Test F: rejects subsidy greater than project price without generating negative principal", () => {
      const projectPrice = 10000000;  // ₹1,00,000
      const excessiveSubsidy = 15000000; // ₹1,50,000 (exceeds price)

      expect(() => calculateAmountFinanced(projectPrice, excessiveSubsidy, 0)).toThrow(
        "Upfront subsidies cannot exceed total project price."
      );

      // Clamping behavior in full engine guarantees non-negative principal
      const breakdown = calculateFinancingBreakdown({
        grossPriceMinor: projectPrice,
        downPaymentMinor: 0,
        incentives: [
          {
            id: "excessive_sub",
            name: "Excessive Subsidy",
            amountMinor: excessiveSubsidy,
            category: "pos_utility_rebate",
            timing: "instant",
          },
        ],
        annualRatePct: 7.0,
        termMonths: 60,
      });
      expect(breakdown.posRebatesMinor).toBe(projectPrice);
      expect(breakdown.amountFinancedMinor).toBe(0);
      expect(breakdown.amountFinancedMinor).toBeGreaterThanOrEqual(0);
    });

    // Test G: Change APR or loan tenure -> EMI updates dynamically
    it("Test G: dynamically updates EMI when APR or tenure changes", () => {
      const principal = 12200000; // ₹1,22,000 from Test A (in paise)

      // 60 months at 7.00%
      const emi60m7pct = calculateMonthlyEMI(principal, 7.0, 60);
      expect(Math.round(emi60m7pct / 100)).toBe(2416); // ₹2,416 / mo
      expect(emi60m7pct).toBe(241575); // Exact paise: 241575

      // Change tenure: 84 months at 7.00%
      const emi84m7pct = calculateMonthlyEMI(principal, 7.0, 84);
      expect(Math.round(emi84m7pct / 100)).toBe(1841); // ₹1,841 / mo
      expect(emi84m7pct).toBe(184131); // Exact paise: 184131
      expect(emi84m7pct).toBeLessThan(emi60m7pct);

      // Change APR: 60 months at 8.25%
      const emi60m825pct = calculateMonthlyEMI(principal, 8.25, 60);
      expect(Math.round(emi60m825pct / 100)).toBe(2488); // ₹2,488 / mo
      expect(emi60m825pct).toBeGreaterThan(emi60m7pct);

      // Total repayment and total interest match
      const totalRepayment = calculateTotalRepayment(emi60m7pct, 60);
      expect(totalRepayment).toBe(241575 * 60);
      const totalInterest = calculateTotalInterest(totalRepayment, principal);
      expect(totalInterest).toBe(totalRepayment - principal);
    });
  });

  describe("Phase 2.1 Standalone Authoritative Financial Functions", () => {
    it("calculateProjectPrice correctly sums item amounts", () => {
      const items = [
        { amountMinor: 9000000 },
        { amountMinor: 4500000 },
        { amountMinor: 1500000 },
      ];
      expect(calculateProjectPrice(items)).toBe(15000000); // ₹1,50,000
    });

    it("calculateDownPayment clamps to net invoice", () => {
      const { clampedMinor, maxAllowedMinor } = calculateDownPayment(3000000, 2000000);
      expect(clampedMinor).toBe(2000000);
      expect(maxAllowedMinor).toBe(2000000);
    });

    it("validateBuyDown enforces 5% cap", () => {
      const underCap = validateBuyDown(10000000, 400000, 5); // 4% requested
      expect(underCap.isWithinCap).toBe(true);
      expect(underCap.clampedMinor).toBe(400000);

      const overCap = validateBuyDown(10000000, 800000, 5); // 8% requested
      expect(overCap.isWithinCap).toBe(false);
      expect(overCap.clampedMinor).toBe(500000); // 5% capped at ₹5,000
    });

    it("calculateAPRDisclosure computes exact APR", () => {
      const emi = calculateMonthlyEMI(12200000, 7.0, 60);
      const apr = calculateAPRDisclosure(12200000, emi, 60, 0);
      expect(apr).toBeCloseTo(7.0, 1);
    });

    it("calculateEligibleIncentives summarizes upfront, tax credits, and post install", () => {
      const incentives = [
        {
          id: "pm_surya",
          name: "PM Surya Ghar CFA",
          amountMinor: 7800000,
          category: "pos_utility_rebate" as const,
          timing: "instant" as const,
        },
        {
          id: "discom_state",
          name: "State DISCOM Extra Subsidy",
          amountMinor: 2000000,
          category: "state_tax_credit" as const,
          timing: "after_installation" as const,
        },
      ];

      const breakdown = calculateEligibleIncentives(incentives);
      expect(breakdown.upfrontRebatesMinor).toBe(7800000);
      expect(breakdown.futureTaxCreditsMinor).toBe(2000000);
      expect(breakdown.totalIncentivesMinor).toBe(9800000);
    });

    it("calculateUpfrontRebates and calculateFutureTaxCredits categorize correctly", () => {
      const incentives = [
        {
          id: "pm_surya",
          name: "PM Surya Ghar CFA",
          amountMinor: 7800000,
          category: "pos_utility_rebate" as const,
          timing: "instant" as const,
        },
        {
          id: "state_tax",
          name: "State Solar Incentive",
          amountMinor: 2000000,
          category: "state_tax_credit" as const,
          timing: "after_installation" as const,
        },
      ];

      expect(calculateUpfrontRebates(incentives)).toBe(7800000);
      expect(calculateFutureTaxCredits(incentives)).toBe(2000000);
    });

    it("calculateAmountFinanced properly applies formula", () => {
      // Amount Financed = Project Price - Upfront Rebates - Down Payment + Financed Fees
      const financed = calculateAmountFinanced(22000000, 7800000, 2000000, 150000);
      expect(financed).toBe(12350000); // ₹1,22,000 + ₹1,500 fee = ₹1,23,500
    });
  });
});
