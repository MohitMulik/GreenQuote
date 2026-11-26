import {
  calculatePmSuryaGharCfa,
  calculateIndianSolarFinancing,
  calculateEmi,
  calculateApr,
  PrequalificationSubmitSchema,
  RegisterContractorSchema,
} from "../index.js";

describe("Day 2 — GreenQuote India Localisation & Financial Engine Suite", () => {
  describe("1. PM Surya Ghar Subsidy Engine (Task 1)", () => {
    // Formula: min(kW, 2) × ₹30,000 + min(max(kW - 2, 0), 1) × ₹18,000. Cap = ₹78,000

    it("calculates exactly ₹30,000 for 1 kW solar system", () => {
      const res = calculatePmSuryaGharCfa(1);
      expect(res.cfaAmountRupees).toBe(30000);
      expect(res.cfaAmountMinor).toBe(3000000);
      expect(res.tier1CfaMinor).toBe(3000000);
      expect(res.tier2CfaMinor).toBe(0);
      expect(res.isCapped).toBe(false);
    });

    it("calculates exactly ₹60,000 for 2 kW solar system", () => {
      const res = calculatePmSuryaGharCfa(2);
      expect(res.cfaAmountRupees).toBe(60000);
      expect(res.cfaAmountMinor).toBe(6000000);
      expect(res.tier1CfaMinor).toBe(6000000);
      expect(res.tier2CfaMinor).toBe(0);
      expect(res.isCapped).toBe(false);
    });

    it("calculates exactly ₹78,000 for 3 kW solar system", () => {
      const res = calculatePmSuryaGharCfa(3);
      expect(res.cfaAmountRupees).toBe(78000);
      expect(res.cfaAmountMinor).toBe(7800000);
      expect(res.tier1CfaMinor).toBe(6000000);
      expect(res.tier2CfaMinor).toBe(1800000);
      expect(res.isCapped).toBe(true);
    });

    it("strictly caps CFA at ₹78,000 for above 3 kW (e.g. 5 kW and 10 kW)", () => {
      const res5 = calculatePmSuryaGharCfa(5);
      expect(res5.cfaAmountRupees).toBe(78000);
      expect(res5.cfaAmountMinor).toBe(7800000);
      expect(res5.isCapped).toBe(true);

      const res10 = calculatePmSuryaGharCfa(10);
      expect(res10.cfaAmountRupees).toBe(78000);
      expect(res10.cfaAmountMinor).toBe(7800000);
    });

    it("calculates partial kW accurately (e.g. 2.5 kW -> 2 kW @ 30k + 0.5 kW @ 18k = 69,000)", () => {
      const res = calculatePmSuryaGharCfa(2.5);
      expect(res.cfaAmountRupees).toBe(69000);
      expect(res.cfaAmountMinor).toBe(6900000);
    });

    it("returns 0 for zero capacity", () => {
      const res = calculatePmSuryaGharCfa(0);
      expect(res.cfaAmountRupees).toBe(0);
      expect(res.cfaAmountMinor).toBe(0);
    });

    it("safely handles invalid or negative capacity without throwing", () => {
      const resNeg = calculatePmSuryaGharCfa(-3);
      expect(resNeg.cfaAmountRupees).toBe(0);
      expect(resNeg.cfaAmountMinor).toBe(0);

      const resNaN = calculatePmSuryaGharCfa(NaN);
      expect(resNaN.cfaAmountRupees).toBe(0);
      expect(resNaN.cfaAmountMinor).toBe(0);
    });
  });

  describe("2. Financial Reconciliation & Loan Structuring (Task 2 & 3)", () => {
    it("ensures mathematical parity between gross price, down payment, and initial principal", () => {
      const grossPriceMinor = 22000000; // ₹2,20,000 (3 kW system)
      const downPaymentMinor = 2000000;  // ₹20,000 down payment
      const solarCapacityKw = 3;

      const financing = calculateIndianSolarFinancing({
        grossProjectPriceMinor: grossPriceMinor,
        solarCapacityKw,
        downPaymentMinor,
        annualRatePct: 7.00,
        termMonths: 60,
        processingFeePct: 1.0,
        gstPctOnFees: 18.0,
        treatment: "gross_financing_future_receipt",
      });

      // Gross financing: initial loan = Gross - Down payment
      expect(financing.initialPrincipalMinor).toBe(20000000); // ₹2,00,000
      expect(financing.eligibleCfaRupees).toBe(78000);

      // Verify processing fee & 18% GST:
      // Base fee = 1% of ₹2,00,000 = ₹2,000 = 200,000 paise
      // GST = 18% of ₹2,000 = ₹360 = 36,000 paise
      // Total charges = ₹2,360 = 236,000 paise
      expect(financing.baseProcessingFeeMinor).toBe(200000);
      expect(financing.gstOnProcessingFeeMinor).toBe(36000);
      expect(financing.totalUpfrontBankingChargesMinor).toBe(236000);

      // Verify Total Cost of Credit = Total Repayment + Total Upfront Banking Charges
      expect(financing.totalCostOfCreditMinor).toBe(
        financing.totalRepaymentMinor + financing.totalUpfrontBankingChargesMinor
      );
    });

    it("simulates subsidy part-prepayment reduction in interest without penalty", () => {
      const financing = calculateIndianSolarFinancing({
        grossProjectPriceMinor: 22000000,
        solarCapacityKw: 3,
        downPaymentMinor: 2000000,
        annualRatePct: 7.00,
        termMonths: 60,
        treatment: "subsidy_part_prepayment",
      });

      // Post-subsidy principal = ₹2,00,000 - ₹78,000 = ₹1,22,000 (12,200,000 paise)
      expect(financing.postSubsidyPrincipalMinor).toBe(12200000);
      expect(financing.postSubsidyMonthlyEmiMinor).toBeLessThan(financing.monthlyEmiMinor);
      expect(financing.postSubsidyInterestSavingsMinor).toBeGreaterThan(0);
    });

    it("verifies bridge financing scenario distinguishing gross from bridged amount", () => {
      const financing = calculateIndianSolarFinancing({
        grossProjectPriceMinor: 22000000, // ₹2,20,000
        solarCapacityKw: 3,               // ₹78,000 CFA
        downPaymentMinor: 2000000,        // ₹20,000
        annualRatePct: 7.00,
        termMonths: 60,
        treatment: "bridge_financing",
      });

      // Net after subsidy = ₹2,20,000 - ₹78,000 = ₹1,42,000
      // Net after down payment = ₹1,42,000 - ₹20,000 = ₹1,22,000
      expect(financing.initialPrincipalMinor).toBe(12200000);
    });
  });

  describe("3. Actuarial APR and All-in Banking Charges (Task 4)", () => {
    it("distinguishes nominal rate from all-in APR including processing fees and GST", () => {
      const principalMinor = 10000000; // ₹1,00,000
      const nominalRate = 7.00;
      const termMonths = 60;

      const emi = calculateEmi({
        amountFinancedMinor: principalMinor,
        annualRatePct: nominalRate,
        termMonths,
      });

      // With 0 fee, APR must equal nominal interest rate
      const cleanApr = calculateApr(principalMinor, emi.monthlyPaymentMinor, termMonths, 0);
      expect(cleanApr).toBe(7.00);

      // With 1% fee + 18% GST (₹1,180 prepaid charge = 118,000 paise)
      const allInApr = calculateApr(principalMinor, emi.monthlyPaymentMinor, termMonths, 118000);
      expect(allInApr).toBeGreaterThan(nominalRate);
      expect(allInApr).toBeCloseTo(7.53, 1);
    });
  });

  describe("4. India-Specific Schemas & Legacy Compatibility (Task 5 & 6)", () => {
    it("accepts valid Indian PAN numbers in prequalification submission", () => {
      const validPayload = {
        quoteId: "qte_valid_123",
        selectedTier: "better",
        downPaymentMinor: 2000000,
        applicant: {
          dateOfBirth: "1988-05-12",
          annualIncomeMinor: 95000000,
          housingPaymentMinor: 1500000,
          panNumber: "ABCDE1234F",
        },
        consent: {
          softPullAgreed: true,
          tcpaAgreed: true,
        },
      };

      const result = PrequalificationSubmitSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("preserves backward compatibility with legacy ssnLastFour field", () => {
      const legacyPayload = {
        quoteId: "qte_legacy_456",
        selectedTier: "good",
        downPaymentMinor: 1000000,
        applicant: {
          dateOfBirth: "1990-01-01",
          annualIncomeMinor: 60000000,
          housingPaymentMinor: 1000000,
          ssnLastFour: "9988",
        },
        consent: {
          softPullAgreed: true,
          tcpaAgreed: true,
        },
      };

      const result = PrequalificationSubmitSchema.safeParse(legacyPayload);
      expect(result.success).toBe(true);
    });

    it("validates contractor registration with GSTIN and 6-digit PIN code", () => {
      const contractorPayload = {
        legalName: "SuryaShakti Solar Solutions Pvt. Ltd.",
        tradeName: "SuryaShakti Solar",
        gstin: "27AABCU9603R1ZM",
        pan: "AABCU9603R",
        businessAddress: {
          street: "Plot 104, Hinjewadi Phase 1",
          city: "Pune",
          state: "MH",
          pinCode: "411057",
        },
        owner: {
          fullName: "Aditya Deshmukh",
          email: "aditya@suryashakti.in",
          phone: "+91 98230 11223",
          password: "SecurePassword123!",
        },
      };

      const result = RegisterContractorSchema.safeParse(contractorPayload);
      expect(result.success).toBe(true);
    });
  });
});
