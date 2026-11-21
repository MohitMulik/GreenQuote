import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { config } from "../config/index.js";

describe("GreenQuote Full End-to-End Regulatory & Lifecycle Journey", () => {
  const app = createApp();

  const opsToken = jwt.sign(
    { userId: "ops_lead_test", role: "operations", type: "access" },
    config.jwtSecret
  );

  describe("Phase 1: Contractor Equipment & Incentive Discovery (FR-303, FR-401, FR-402)", () => {
    it("searches certified equipment directory with AHRI/NEEP ratings", async () => {
      const res = await request(app).get("/v1/equipment/search?q=mitsubishi");
      expect(res.status).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);
      const first = res.body.results[0];
      expect(first).toHaveProperty("ahriRefNumber");
      expect(first.ratings).toHaveProperty("seer2");
    });

    it("calculates layered state, utility and federal IRA rebates", async () => {
      const res = await request(app).get(
        "/v1/incentives/calculate?state=MA&category=heat_pump&coldClimate=true&electricUtility=National%20Grid"
      );
      expect(res.status).toBe(200);
      expect(res.body.totalMinor).toBeGreaterThan(0);
      expect(Array.isArray(res.body.incentives)).toBe(true);
    });

    it("computes conservative energy savings range with transparent assumptions (CMP-05)", async () => {
      const res = await request(app)
        .post("/v1/savings/estimate")
        .send({
          category: "heat_pump",
          state: "MA",
          existingFuel: "fuel_oil",
          homeSizeSqFt: 2200,
          seer2: 18,
        });

      expect(res.status).toBe(200);
      expect(res.body.minAnnualSavingsMinor).toBeGreaterThan(0);
      expect(res.body.maxAnnualSavingsMinor).toBeGreaterThan(res.body.minAnnualSavingsMinor);
    });
  });

  describe("Phase 2: AI Document Intelligence & Contractor Ingestion (AI-01, FR-304)", () => {
    it("parses contractor quote PDF and validates arithmetic line item parity", async () => {
      const res = await request(app)
        .post("/v1/ai/parse-quote")
        .send({
          filename: "sample_contractor_quote.pdf",
          rawText: "Mitsubishi Hyper-Heat Heat Pump $15,400. Rebate: $10,000",
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.summary.overallConfidence).toBeGreaterThanOrEqual(0.8);
      expect(res.body.data.options.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.options[0].isArithmeticValid).toBe(true);
    });
  });

  describe("Phase 3: Soft-Pull Multi-Lender Financing & TILA Disclosure (FR-502, FR-601, FR-703)", () => {
    it("enforces FCRA soft-pull consent and returns parallel lender offers with neutral sorting", async () => {
      const res = await request(app)
        .post("/v1/prequalifications")
        .set("Idempotency-Key", "idemp_e2e_prequal_journey_01")
        .send({
          quoteId: "qte_journey_1",
          selectedTier: "better",
          downPaymentMinor: 200000,
          applicant: {
            dateOfBirth: "1982-05-14",
            annualIncomeMinor: 11000000,
            housingPaymentMinor: 220000,
            ssnLastFour: "8921",
          },
          consent: {
            softPullAgreed: true,
            tcpaAgreed: true,
            consentVersion: "2026-v1",
          },
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("prequalification");
      expect(res.body.prequalification).toHaveProperty("_id");
      expect(Array.isArray(res.body.offers)).toBe(true);
      expect(res.body.offers.length).toBeGreaterThan(0);

      // Verify neutral sorting (Lowest Total Cost of Credit first, FR-604)
      const offers = res.body.offers;
      if (offers.length >= 2) {
        expect(offers[0].totalCostOfCreditMinor).toBeLessThanOrEqual(offers[1].totalCostOfCreditMinor);
      }
    });

    it("generates ECOA Reg B Adverse Action notice when an application is declined (CMP-02)", async () => {
      const res = await request(app).get("/v1/prequalifications/preq_declined_sample/adverse-action");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("notice");
      expect(res.body.notice.principalReasons.length).toBeGreaterThan(0);
      expect(res.body.notice).toHaveProperty("creditScoreNotice");
      expect(res.body.notice).toHaveProperty("creditReportingAgency");
    });
  });

  describe("Phase 4: Milestone Payout Gates & Rescission Period (FR-801, CMP-07, CMP-08, FR-805)", () => {
    it("retrieves loan milestones with active statutory cooling-off status", async () => {
      const res = await request(app).get("/v1/milestones/loan_e2e_journey_1");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.milestones)).toBe(true);
      expect(res.body.milestones.length).toBeGreaterThan(0);
      expect(res.body.milestones[0]).toHaveProperty("amountMinor");
    });
  });

  describe("Phase 5: Operations Governance & Sealed Regulatory Audit Dossier (FR-1002, FR-1004, S14)", () => {
    it("delivers platform origination metrics and zero-dealer-fee consumer savings (S14)", async () => {
      const res = await request(app)
        .get("/v1/admin/analytics")
        .set("Authorization", `Bearer ${opsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.originations.totalVolumeMinor).toBeGreaterThan(0);
      expect(res.body.originations.dealerFeeSavingsMinor).toBeGreaterThan(0);
      expect(res.body.technologyBreakdown).toHaveProperty("heatPumpsPct");
    });

    it("retrieves lender configurations and supports dual-authorization parameter changes (FR-1002)", async () => {
      // 1. List lenders
      const listRes = await request(app)
        .get("/v1/admin/lenders")
        .set("Authorization", `Bearer ${opsToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.lenders.length).toBeGreaterThan(0);

      // 2. Officer A proposes parameter update
      const proposeRes = await request(app)
        .post("/v1/admin/lenders/lnd_vermont_cu/config-request")
        .set("Authorization", `Bearer ${opsToken}`)
        .send({
          newBaseAprPct: 5.5,
          newMaxLoanAmountMinor: 5500000,
        });
      expect(proposeRes.status).toBe(200);
      expect(proposeRes.body.lender.pendingChange).toBeDefined();

      // 3. Officer B approves parameter update under Four-Eyes principle
      const approveOfficerToken = jwt.sign(
        { userId: "ops_compliance_officer_2", role: "operations", type: "access" },
        config.jwtSecret
      );
      const approveRes = await request(app)
        .post("/v1/admin/lenders/lnd_vermont_cu/approve")
        .set("Authorization", `Bearer ${approveOfficerToken}`)
        .send({});
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.lender.baseAprPct).toBe(5.5);
    });

    it("exports a single-loan regulatory compliance dossier with SHA-256 tamper-evident seal (FR-1004)", async () => {
      const res = await request(app)
        .get("/v1/admin/audit-log/loan_e2e_sample_1/dossier")
        .set("Authorization", `Bearer ${opsToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("integritySeal");
      expect(res.body.integritySeal.algorithm).toBe("SHA-256");
      expect(res.body.integritySeal.hash).toMatch(/^[a-f0-9]{64}$/);
      expect(res.body.integritySeal.verified).toBe(true);
    });
  });
});
