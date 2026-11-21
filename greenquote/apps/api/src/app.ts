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

  app.use("/v1", apiRouter);
  app.use(errorHandler);

  return app;
}
