import { Request, Response, NextFunction } from "express";
import { ESignSubmitSchema } from "@greenquote/shared";
import { esignService } from "./esign.service.js";

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() || req.ip || "127.0.0.1";
  return req.ip || "127.0.0.1";
}

export async function submitEsign(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = ESignSubmitSchema.parse(req.body);

    if (!req.user) {
      res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Authentication required to execute loan agreement.",
      });
      return;
    }

    const userAgent = req.headers["user-agent"] || "unknown-agent";
    const signerIp = clientIp(req);

    const record = await esignService.submitSignature({
      ...validated,
      signerIp,
      userAgent,
      authenticatedHomeownerQuoteId: req.user.quoteId,
    });

    res.status(201).json({
      message: "Loan agreement executed successfully.",
      documentId: record._id,
      signatureHash: record.signatureHash,
      signedAt: record.signedAt,
      retentionPolicy: "7 years (FR-704 / E-SIGN compliant)",
    });
  } catch (err) {
    next(err);
  }
}

export async function getEsignRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const { offerId } = req.params;
    if (!offerId) {
      res.status(400).json({ code: "BAD_REQUEST", message: "offerId is required" });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Authentication required to view signed document.",
      });
      return;
    }

    const record = await esignService.getEsignRecord(offerId);
    if (!record) {
      res.status(404).json({ code: "NOT_FOUND", message: "E-signature record not found" });
      return;
    }

    if (req.user.role === "homeowner" && req.user.quoteId && req.user.quoteId !== record.quoteId) {
      res.status(403).json({
        code: "FORBIDDEN",
        message: "You are not authorized to view this document.",
      });
      return;
    }

    if (
      (req.user.role === "contractor_owner" || req.user.role === "contractor_advisor") &&
      req.user.contractorId
    ) {
      if (record.contractorId !== req.user.contractorId) {
        res.status(403).json({
          code: "FORBIDDEN",
          message: "Document belongs to another contractor organization.",
        });
        return;
      }
    }

    res.json({ record });
  } catch (err) {
    next(err);
  }
}
