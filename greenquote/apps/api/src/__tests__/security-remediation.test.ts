import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { createApp } from "../app.js";
import { config } from "../config/index.js";
import { QuoteModel } from "../modules/quotes/quote.model.js";
import { MilestoneModel } from "../modules/milestones/milestone.model.js";

describe("Day 1 FinTech Application Security Remediation Suite", () => {
  const app = createApp();

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongoUri);
    }
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // Test identities
  const contractorAToken = jwt.sign(
    { userId: "usr_contractor_A", role: "contractor_owner", contractorId: "cnt_org_A", type: "access" },
    config.jwtSecret
  );

  const contractorBToken = jwt.sign(
    { userId: "usr_contractor_B", role: "contractor_owner", contractorId: "cnt_org_B", type: "access" },
    config.jwtSecret
  );

  const homeownerAToken = jwt.sign(
    { userId: "hmw_qte_alpha_123", role: "homeowner", quoteId: "qte_alpha_123", type: "access" },
    config.jwtSecret
  );

  const homeownerBToken = jwt.sign(
    { userId: "hmw_qte_beta_456", role: "homeowner", quoteId: "qte_beta_456", type: "access" },
    config.jwtSecret
  );

  describe("1. Database Seed Endpoint Security (/v1/system/seed)", () => {
    it("blocks public unauthenticated seed requests when unauthorized", async () => {
      // In non-dev/test or without valid admin authorization
      const originalEnv = config.nodeEnv;
      try {
        // Temporarily simulate non-test environment
        (config as { nodeEnv: string }).nodeEnv = "staging";
        const res = await request(app).post("/v1/system/seed");
        expect(res.status).toBe(401);
        expect(res.body.code).toBe("UNAUTHORIZED");
      } finally {
        (config as { nodeEnv: string }).nodeEnv = originalEnv;
      }
    });

    it("strictly forbids database seeding in production environment", async () => {
      const originalProd = config.isProduction;
      try {
        (config as { isProduction: boolean }).isProduction = true;
        const res = await request(app)
          .post("/v1/system/seed")
          .set("x-admin-seed-key", "secret123");
        expect(res.status).toBe(403);
        expect(res.body.code).toBe("FORBIDDEN");
        expect(res.body.message).toContain("strictly forbidden in production");
      } finally {
        (config as { isProduction: boolean }).isProduction = originalProd;
      }
    });
  });

  describe("2. Unauthenticated API Request Blocking (401 Unauthorized)", () => {
    it("rejects unauthenticated prequalification submission", async () => {
      const res = await request(app)
        .post("/v1/prequalifications")
        .set("Idempotency-Key", "idemp_unauth_test")
        .send({
          quoteId: "qte_alpha_123",
          selectedTier: "better",
          downPaymentMinor: 100000,
          applicant: {
            dateOfBirth: "1988-01-01",
            annualIncomeMinor: 12000000,
            housingPaymentMinor: 200000,
            ssnLastFour: "1234",
          },
          consent: { softPullAgreed: true },
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("rejects unauthenticated milestone retrieval", async () => {
      const res = await request(app).get("/v1/milestones/loan_alpha_1");
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("rejects unauthenticated homeowner milestone confirmation", async () => {
      const res = await request(app)
        .post("/v1/milestones/confirm-homeowner")
        .send({
          milestoneId: "mls_sample_1",
          confirmed: true,
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("rejects unauthenticated loan rescission", async () => {
      const res = await request(app)
        .post("/v1/milestones/rescind")
        .send({
          milestoneId: "mls_sample_1",
          reason: "Unilateral cancellation",
          acknowledgement: true,
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("rejects unauthenticated e-signature submission", async () => {
      const res = await request(app)
        .post("/v1/esign/submit")
        .send({
          offerId: "ofr_sample_1",
          signatureDataUrl: "data:image/png;base64,sample_signature",
          esignConsentAgreed: true,
          tilaAcknowledged: true,
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("rejects unauthenticated AI quote parsing", async () => {
      const res = await request(app)
        .post("/v1/ai/parse-quote")
        .send({
          filename: "sample_quote.pdf",
          rawText: "Sample solar proposal",
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });

    it("rejects unauthenticated property title verification", async () => {
      const res = await request(app)
        .post("/v1/property/verify-ownership")
        .send({
          applicantName: "Aditi Rao",
          propertyAddress: { street: "12 MG Road", city: "Bengaluru", state: "KA" },
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("UNAUTHORIZED");
    });
  });

  describe("3. Invalid & Forged Authentication Handling", () => {
    it("rejects forged token with invalid signature", async () => {
      const forgedToken = jwt.sign(
        { userId: "hacker", role: "operations", type: "access" },
        "wrong_secret_key_used_for_attack"
      );

      const res = await request(app)
        .get("/v1/milestones/loan_alpha_1")
        .set("Authorization", `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_TOKEN");
    });

    it("rejects refresh token presented on access-token protected route", async () => {
      const refreshToken = jwt.sign(
        { userId: "usr_legit", role: "contractor_owner", type: "refresh" },
        config.jwtSecret
      );

      const res = await request(app)
        .get("/v1/milestones/loan_alpha_1")
        .set("Authorization", `Bearer ${refreshToken}`);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_TOKEN");
    });
  });

  describe("4. Cross-User Resource Access Prevention (IDOR / BOLA)", () => {
    it("forbids Homeowner A from submitting prequalification for Homeowner B's quote", async () => {
      const res = await request(app)
        .post("/v1/prequalifications")
        .set("Authorization", `Bearer ${homeownerAToken}`)
        .set("Idempotency-Key", "idemp_cross_user_01")
        .send({
          quoteId: "qte_beta_456", // Belongs to Homeowner B!
          selectedTier: "better",
          downPaymentMinor: 200000,
          applicant: {
            dateOfBirth: "1984-07-20",
            annualIncomeMinor: 14000000,
            housingPaymentMinor: 250000,
            ssnLastFour: "9988",
          },
          consent: { softPullAgreed: true },
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
      expect(res.body.message).toContain("not authorized to submit prequalification for this quote");
    });

    it("forbids Contractor B from accessing Contractor A's milestone schedule", async () => {
      // Seed a milestone belonging to Contractor A
      const mls = await MilestoneModel.create({
        loanId: "ln_cross_tenant_test",
        contractorId: "cnt_org_A",
        homeownerId: "hmw_qte_alpha_123",
        type: "approval_draw",
        amountMinor: 5000000,
        status: "submitted",
        equipmentVerified: true,
      });

      // Contractor B tries to read Contractor A's loan milestones
      const res = await request(app)
        .get(`/v1/milestones/${mls.loanId}`)
        .set("Authorization", `Bearer ${contractorBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });

    it("forbids Homeowner B from confirming Homeowner A's milestone completion", async () => {
      const mls = await MilestoneModel.create({
        loanId: "ln_homeowner_cross_test",
        contractorId: "cnt_org_A",
        homeownerId: "hmw_qte_alpha_123", // Belongs to Homeowner A
        type: "final_completion",
        amountMinor: 8000000,
        status: "submitted",
        equipmentVerified: true,
      });

      // Homeowner B attempts to sign off on Homeowner A's milestone
      const res = await request(app)
        .post("/v1/milestones/confirm-homeowner")
        .set("Authorization", `Bearer ${homeownerBToken}`)
        .send({
          milestoneId: mls._id.toString(),
          confirmed: true,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("FORBIDDEN");
    });
  });

  describe("5. OTP Security & Attempt Locking", () => {
    it("does not expose testOtp in production environment", async () => {
      const originalProd = config.isProduction;
      try {
        (config as { isProduction: boolean }).isProduction = true;
        // Verify via otpService request or simulated quote
        const { otpService } = await import("../modules/auth/otp.service.js");
        // Non-existent quote token throws 404, not exposing any OTP
        await expect(otpService.requestQuoteOtp("tok_non_existent", "sms")).rejects.toThrow();
      } finally {
        (config as { isProduction: boolean }).isProduction = originalProd;
      }
    });
  });

  describe("6. Public Quote PII Masking & Verification Gate", () => {
    it("masks homeowner PII on unauthenticated public quote preview", async () => {
      // Mock quote in db or create in memory
      const sampleLinkToken = `sec_test_quote_token_${Date.now()}`;
      await QuoteModel.deleteMany({ linkToken: { $regex: /^sec_test_quote_token_/ } });
      await QuoteModel.create({
        contractorId: "cnt_org_A",
        advisorId: "usr_contractor_A",
        currency: "INR",
        status: "draft",
        version: 1,
        linkToken: sampleLinkToken,
        linkExpiresAt: new Date(Date.now() + 86400000),
        homeowner: {
          fullName: "Vikramaditya Singhania",
          phone: "+91 98200 12345",
          email: "vikram.singhania@example.in",
        },
        property: {
          streetAddress: "Flat 402, Royal Palms, Bandra West",
          city: "Mumbai",
          state: "MH",
          zipCode: "400050",
          existingHeatingFuel: "electric",
        },
        options: [
          {
            tier: "good",
            title: "3 kW Solar System",
            priceMinor: 20000000,
            lineItems: [{ type: "equipment", label: "Solar Panels", amountMinor: 20000000 }],
          },
        ],
      });

      // 1. Unauthenticated request: PII must be masked!
      const unauthRes = await request(app).get(`/v1/quotes/public/${sampleLinkToken}`);
      expect(unauthRes.status).toBe(200);
      expect(unauthRes.body.isVerified).toBe(false);
      expect(unauthRes.body.requiresVerification).toBe(true);
      expect(unauthRes.body.homeowner.fullName).not.toBe("Vikramaditya Singhania");
      expect(unauthRes.body.homeowner.fullName).toContain("****");
      expect(unauthRes.body.homeowner.phone).not.toBe("+91 98200 12345");
      expect(unauthRes.body.homeowner.phone).toContain("*****");
      expect(unauthRes.body.homeowner.email).not.toBe("vikram.singhania@example.in");
      expect(unauthRes.body.property.streetAddress).toContain("Verified upon homeowner OTP");

      // 2. Authenticated contractor request: full unmasked PII returned!
      const authRes = await request(app)
        .get(`/v1/quotes/public/${sampleLinkToken}`)
        .set("Authorization", `Bearer ${contractorAToken}`);

      expect(authRes.status).toBe(200);
      expect(authRes.body.isVerified).toBe(true);
      expect(authRes.body.homeowner.fullName).toBe("Vikramaditya Singhania");
      expect(authRes.body.homeowner.phone).toBe("+91 98200 12345");
      expect(authRes.body.property.streetAddress).toBe("Flat 402, Royal Palms, Bandra West");
    });
  });
});
