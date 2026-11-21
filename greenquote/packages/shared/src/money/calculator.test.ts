import {
  calculateEmi,
  calculateBuyDown,
  calculateApr,
  generateAmortizationSchedule,
  formatCurrency,
} from "./calculator.js";

describe("Financial Calculation Engine", () => {
  describe("PRD Section 4.5 Worked Example: ₹1,80,000 Solar Loan (18,000,000 paise)", () => {
    const amountFinancedPaise = 18000000; // ₹1,80,000
    const termMonths = 60;
    const ratePct = 5.75;

    it("should calculate exact EMI of ₹3,459 (345,902 paise)", () => {
      const result = calculateEmi({
        amountFinancedMinor: amountFinancedPaise,
        annualRatePct: ratePct,
        termMonths,
      });

      // From PRD Section 4.5: Monthly payment is ₹3,459 (345,902 paise integer precision)
      expect(result.monthlyPaymentMinor).toBe(345902);
      expect(result.totalRepaymentMinor).toBe(345902 * 60); // ₹2,07,541.20
      expect(result.totalInterestMinor).toBe(345902 * 60 - amountFinancedPaise); // ₹27,541.20
    });

    it("should calculate buy-down cost and enforce 5% cap (FR-603)", () => {
      // PRD Section 4.5: Lender B co-op loan bought down from 8.50% to 7.50%
      const buyDown = calculateBuyDown({
        amountFinancedMinor: amountFinancedPaise,
        originalRatePct: 8.50,
        targetRatePct: 7.50,
        termMonths: 60,
      });

      // Max allowed buy-down is 5% of ₹1,80,000 = ₹9,000 (900,000 paise)
      expect(buyDown.maxAllowedBuyDownMinor).toBe(900000);
      expect(buyDown.isWithinCap).toBe(true);
      // Cost should be ~₹4,199 (419,900 paise)
      expect(Math.abs(buyDown.contractorBuyDownCostMinor - 419900)).toBeLessThan(15000); // within rounding variance
    });
  });

  describe("US HVAC Market Example: $10,000 at 7.99% for 60 months", () => {
    const amountFinancedCents = 1000000; // $10,000.00
    const termMonths = 60;
    const ratePct = 7.99;

    it("should compute accurate monthly payment and interest", () => {
      const result = calculateEmi({
        amountFinancedMinor: amountFinancedCents,
        annualRatePct: ratePct,
        termMonths,
      });

      // Standard financial formula produces ~$202.72 (20,272 cents)
      expect(result.monthlyPaymentMinor).toBe(20272);
      expect(result.totalRepaymentMinor).toBe(1216320); // $12,163.20
      expect(result.totalInterestMinor).toBe(216320);   // $2,163.20
    });

    it("should generate a complete, balanced amortization schedule", () => {
      const schedule = generateAmortizationSchedule({
        amountFinancedMinor: amountFinancedCents,
        annualRatePct: ratePct,
        termMonths,
      });

      expect(schedule.length).toBe(60);
      expect(schedule[0]?.month).toBe(1);
      expect(schedule[59]?.month).toBe(60);
      expect(schedule[59]?.remainingBalanceMinor).toBe(0); // Fully amortized

      // Sum of principal parts must equal original principal
      const totalPrincipal = schedule.reduce((sum, row) => sum + row.principalMinor, 0);
      expect(totalPrincipal).toBe(amountFinancedCents);
    });
  });

  describe("0% APR Promotional Loan Handling", () => {
    it("should divide principal evenly with zero interest", () => {
      const result = calculateEmi({
        amountFinancedMinor: 1200000, // $12,000
        annualRatePct: 0,
        termMonths: 24,
      });

      expect(result.monthlyPaymentMinor).toBe(50000); // $500/mo
      expect(result.totalInterestMinor).toBe(0);
      expect(result.totalRepaymentMinor).toBe(1200000);
    });
  });

  describe("Currency Formatting", () => {
    it("should format INR in Indian grouping format", () => {
      const formatted = formatCurrency(20000000, "INR"); // ₹2,00,000
      expect(formatted).toContain("2,00,000");
    });

    it("should format USD in standard format", () => {
      const formatted = formatCurrency(1250000, "USD"); // $12,500
      expect(formatted).toContain("12,500");
    });
  });

  describe("APR (TILA actuarial method)", () => {
    it("returns the contract rate when there are no prepaid finance charges", () => {
      const emi = calculateEmi({
        amountFinancedMinor: 1000000,
        annualRatePct: 7.99,
        termMonths: 60,
      });
      const apr = calculateApr(1000000, emi.monthlyPaymentMinor, 60, 0);
      expect(Math.abs(apr - 7.99)).toBeLessThan(0.05);
    });
  });

  describe("QG-2 synthetic precision suite", () => {
    it("keeps integer EMI and balanced amortization across 1,000 loans", () => {
      const terms = [12, 24, 36, 48, 60, 72, 84, 96, 120];
      for (let i = 0; i < 1000; i++) {
        const amountFinancedMinor = 50_000 + i * 1_731;
        const termMonths = terms[i % terms.length] as number;
        const annualRatePct = (i % 2_400) / 100;
        const result = calculateEmi({ amountFinancedMinor, annualRatePct, termMonths });
        expect(Number.isInteger(result.monthlyPaymentMinor)).toBe(true);
        expect(result.monthlyPaymentMinor).toBeGreaterThan(0);
        const schedule = generateAmortizationSchedule({
          amountFinancedMinor,
          annualRatePct,
          termMonths,
        });
        const totalPrincipal = schedule.reduce((sum, row) => sum + row.principalMinor, 0);
        expect(totalPrincipal).toBe(amountFinancedMinor);
        expect(schedule[schedule.length - 1]?.remainingBalanceMinor).toBe(0);
      }
    });
  });

  describe("Validation & Safeguards", () => {
    it("should reject negative or zero principal", () => {
      expect(() =>
        calculateEmi({
          amountFinancedMinor: 0,
          annualRatePct: 5,
          termMonths: 12,
        })
      ).toThrow();
    });

    it("should reject non-positive terms", () => {
      expect(() =>
        calculateEmi({
          amountFinancedMinor: 100000,
          annualRatePct: 5,
          termMonths: 0,
        })
      ).toThrow();
    });
  });
});
