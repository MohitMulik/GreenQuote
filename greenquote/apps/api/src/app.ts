import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { config } from "./config/index.js";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { standardLimiter, strictLimiter } from "./middleware/rate-limit.middleware.js";
import { authenticateToken, requireRole } from "./middleware/auth.middleware.js";
import { attachRequestId } from "./middleware/request-id.middleware.js";
import { requireContractorTenant } from "./middleware/tenant.middleware.js";
import { requireIdempotencyKey } from "./middleware/idempotency.middleware.js";

import * as authController from "./modules/auth/auth.controller.js";
import * as equipmentController from "./modules/equipment/equipment.controller.js";
import * as incentiveController from "./modules/incentives/incentive.controller.js";
import * as savingsController from "./modules/savings/savings.controller.js";
import * as quotesController from "./modules/quotes/quotes.controller.js";
import * as prequalController from "./modules/prequal/prequal.controller.js";
import * as adverseActionController from "./modules/offers/adverse-action.controller.js";
import * as milestonesController from "./modules/milestones/milestones.controller.js";
import * as adminController from "./modules/admin/admin.controller.js";
import * as esignController from "./modules/esign/esign.controller.js";
import * as aiController from "./modules/ai/quote-import.controller.js";
import * as contractorController from "./modules/contractors/contractor.controller.js";
import * as fsmController from "./modules/integrations/fsm-webhook.controller.js";
import * as propertyController from "./modules/property/property.controller.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(attachRequestId);
  app.use(
    pinoHttp({
      logger,
      autoLogging: config.nodeEnv !== "test",
    })
  );
  app.use(standardLimiter);

  app.get("/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date(), version: "1.0.0" });
  });

  app.post("/v1/system/seed", async (_req, res) => {
    try {
      const { seedDatabase } = await import("./scripts/seed.js");
      await seedDatabase(false);
      res.json({ success: true, message: "Database seeded successfully with demo users." });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  app.get("/docs", (_req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html>
  <head>
    <title>GreenQuote FinTech API Portal</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>body { margin: 0; padding: 0; background: #0f172a; font-family: Roboto, sans-serif; color: #fff; }</style>
  </head>
  <body>
    <div id="redoc-container"></div>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
    <script>
      Redoc.init('/openapi.json', {
        theme: {
          colors: {
            primary: { main: '#10b981' }
          }
        }
      }, document.getElementById('redoc-container'));
    </script>
  </body>
</html>`);
  });

  app.get("/openapi.json", (_req, res) => {
    res.json({
      openapi: "3.0.3",
      info: {
        title: "GreenQuote FinTech Embedded Lending Platform API",
        version: "1.0.0",
        description: "Production FinTech embedded lending and regulatory compliance engine (FR-101 to FR-1102, CMP-01 to CMP-12)."
      },
      paths: {
        "/health": { get: { summary: "Health Check" } },
        "/v1/quotes": { post: { summary: "Create Quote with Zero Dealer Fee & Parity Check (FR-308)" } },
        "/v1/quotes/public/{token}": { get: { summary: "Consumer Multi-Lender Quote View (FR-401)" } },
        "/v1/prequalifications": { post: { summary: "Soft Credit Check Prequalification with Idempotency (QG-6)" } },
        "/v1/esign/submit": { post: { summary: "TILA Reg Z §1026.18 & E-SIGN Execution (FR-701 / CMP-04)" } },
        "/v1/milestones/{loanId}": { get: { summary: "Milestone Disbursements Schedule (FR-805)" } },
        "/v1/milestones/rescind": { post: { summary: "Statutory 3-Day Right of Rescission Cancellation (CMP-07)" } },
        "/v1/admin/analytics": { get: { summary: "Originations & Regulatory Compliance Analytics (S14)" } },
        "/v1/admin/lenders/{lenderId}/config-request": { post: { summary: "Dual-Control 4-Eyes Config Change (FR-1002)" } }
      }
    });
  });

  const apiRouter = express.Router();

  apiRouter.post("/auth/register", strictLimiter, authController.registerContractor);
  apiRouter.post("/auth/login", strictLimiter, authController.login);
  apiRouter.post("/auth/mfa/verify", strictLimiter, authController.verifyMfa);
  apiRouter.post("/auth/refresh", strictLimiter, authController.refresh);
  apiRouter.post("/auth/logout", authController.logout);
  apiRouter.post("/auth/homeowner/request-otp", strictLimiter, authController.requestHomeownerOtp);
  apiRouter.post("/auth/homeowner/verify-otp", strictLimiter, authController.verifyHomeownerOtp);

  apiRouter.get("/equipment/search", equipmentController.searchEquipment);
  apiRouter.get("/equipment/:id", equipmentController.getEquipmentById);

  apiRouter.get("/incentives/calculate", incentiveController.calculateIncentives);
  apiRouter.get("/incentives/programs", incentiveController.listIncentivePrograms);

  apiRouter.post("/savings/estimate", savingsController.estimateSavings);

  apiRouter.post(
    "/quotes",
    authenticateToken,
    requireRole("contractor_owner", "contractor_advisor"),
    requireContractorTenant,
    quotesController.createQuote
  );
  apiRouter.get(
    "/quotes/pipeline",
    authenticateToken,
    requireRole("contractor_owner", "contractor_advisor"),
    requireContractorTenant,
    quotesController.getPipeline
  );
  apiRouter.get(
    "/quotes/:id",
    authenticateToken,
    requireRole("contractor_owner", "contractor_advisor", "operations"),
    quotesController.getQuote
  );
  apiRouter.post(
    "/quotes/:id/send",
    authenticateToken,
    requireRole("contractor_owner", "contractor_advisor"),
    requireContractorTenant,
    quotesController.sendQuote
  );
  apiRouter.get("/quotes/public/:token", quotesController.getQuoteByToken);

  apiRouter.post(
    "/prequalifications",
    requireIdempotencyKey,
    prequalController.submitPrequalification
  );
  apiRouter.get("/prequalifications/:id/offers", prequalController.streamOffers);
  apiRouter.get("/prequalifications/:prequalificationId/adverse-action", adverseActionController.getAdverseActionNotice);

  apiRouter.get("/milestones/:loanId", milestonesController.getMilestones);
  apiRouter.post(
    "/milestones/submit-evidence",
    authenticateToken,
    requireRole("contractor_owner", "contractor_advisor"),
    requireContractorTenant,
    milestonesController.submitEvidence
  );
  apiRouter.post("/milestones/confirm-homeowner", milestonesController.confirmHomeowner);
  apiRouter.post("/milestones/rescind", milestonesController.exerciseRescission);

  // E-Signature & TILA Reg Z (FR-701 - FR-704)
  apiRouter.post("/esign/submit", esignController.submitEsign);
  apiRouter.get("/esign/:offerId", esignController.getEsignRecord);

  // AI Quote Reader (AI-01 / FR-304)
  apiRouter.post("/ai/parse-quote", aiController.parseQuoteDocument);

  // Contractor Profile & Team Management (FR-104)
  apiRouter.get(
    "/contractors/profile",
    authenticateToken,
    requireRole("contractor_owner", "contractor_advisor"),
    requireContractorTenant,
    contractorController.getProfile
  );
  apiRouter.get(
    "/contractors/team",
    authenticateToken,
    requireRole("contractor_owner"),
    requireContractorTenant,
    contractorController.listTeam
  );
  apiRouter.post(
    "/contractors/team/invite",
    authenticateToken,
    requireRole("contractor_owner"),
    requireContractorTenant,
    contractorController.inviteTeamMember
  );
  apiRouter.get(
    "/contractors/reports/monthly",
    authenticateToken,
    requireRole("contractor_owner", "contractor_advisor"),
    requireContractorTenant,
    contractorController.exportMonthlyReport
  );

  // Operations Console & Compliance (FR-1000 - FR-1004)
  apiRouter.get(
    "/admin/review-queue",
    authenticateToken,
    requireRole("operations"),
    adminController.getReviewQueue
  );
  apiRouter.put(
    "/admin/contractors/:id/status",
    authenticateToken,
    requireRole("operations"),
    adminController.updateContractorStatus
  );
  apiRouter.get(
    "/admin/audit-log",
    authenticateToken,
    requireRole("operations"),
    adminController.getAuditLog
  );
  apiRouter.get(
    "/admin/audit-log/:entityId/dossier",
    authenticateToken,
    requireRole("operations"),
    adminController.exportAuditDossier
  );
  apiRouter.get(
    "/admin/lenders",
    authenticateToken,
    requireRole("operations"),
    adminController.listLenders
  );
  apiRouter.post(
    "/admin/lenders/:lenderId/config-request",
    authenticateToken,
    requireRole("operations"),
    adminController.requestLenderConfigChange
  );
  apiRouter.post(
    "/admin/lenders/:lenderId/approve",
    authenticateToken,
    requireRole("operations"),
    adminController.approveLenderConfigChange
  );
  apiRouter.post(
    "/admin/incentives",
    authenticateToken,
    requireRole("operations"),
    adminController.createIncentiveProgram
  );
  apiRouter.put(
    "/admin/incentives/:id",
    authenticateToken,
    requireRole("operations"),
    adminController.updateIncentiveProgram
  );
  apiRouter.get(
    "/admin/analytics",
    authenticateToken,
    requireRole("operations"),
    adminController.getPlatformAnalytics
  );

  // Field Service Management (FSM) Webhook Integration (FR-310)
  apiRouter.post("/integrations/fsm/webhook", fsmController.handleFsmWebhook);
  apiRouter.get("/integrations/fsm/sources", fsmController.listSupportedFsmProviders);

  // County Property Title & Ownership Verification (FR-504)
  apiRouter.post("/property/verify-ownership", propertyController.checkOwnership);

  app.use("/v1", apiRouter);
  app.use(errorHandler);

  return app;
}
