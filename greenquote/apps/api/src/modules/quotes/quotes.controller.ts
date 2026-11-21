import { Request, Response, NextFunction } from "express";
import { quotesService } from "./quotes.service.js";
import { CreateQuoteSchema } from "@greenquote/shared";

export async function createQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = CreateQuoteSchema.parse(req.body);
    const contractorId = req.tenantId ?? req.user?.contractorId;
    const advisorId = req.user?.userId;
    if (!contractorId || !advisorId) {
      res.status(403).json({ code: "TENANT_REQUIRED", message: "Contractor context required." });
      return;
    }

    const quote = await quotesService.createQuote({
      ...validated,
      contractorId,
      advisorId,
    });

    res.status(201).json(quote);
  } catch (err) {
    next(err);
  }
}

export async function getQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ code: "BAD_REQUEST", message: "Quote ID required." });
      return;
    }
    const contractorId = req.user?.role === "operations" ? undefined : req.user?.contractorId;
    if (req.user?.role !== "operations" && !contractorId) {
      res.status(403).json({ code: "TENANT_REQUIRED", message: "Contractor context required." });
      return;
    }
    const quote = await quotesService.getQuoteById(id, contractorId);
    if (!quote) {
      res.status(404).json({ code: "NOT_FOUND", message: "Quote not found." });
      return;
    }
    res.json(quote);
  } catch (err) {
    next(err);
  }
}

export async function getQuoteByToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;
    if (!token) {
      res.status(400).json({ code: "BAD_REQUEST", message: "Token required." });
      return;
    }
    const quote = await quotesService.getQuoteByToken(token);
    res.json(quote);
  } catch (err) {
    next(err);
  }
}

export async function sendQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ code: "BAD_REQUEST", message: "Quote ID required." });
      return;
    }
    const contractorId = req.tenantId ?? req.user?.contractorId;
    if (!contractorId) {
      res.status(403).json({ code: "TENANT_REQUIRED", message: "Contractor context required." });
      return;
    }
    const result = await quotesService.sendQuote(id, contractorId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getPipeline(req: Request, res: Response, next: NextFunction) {
  try {
    const contractorId = req.tenantId ?? req.user?.contractorId;
    if (!contractorId) {
      res.status(403).json({ code: "TENANT_REQUIRED", message: "Contractor context required." });
      return;
    }
    const advisorId = req.user?.userId;
    const isOwner = req.user?.role === "contractor_owner";

    const pipeline = await quotesService.getContractorPipeline(contractorId, advisorId, isOwner);
    res.json({ pipeline });
  } catch (err) {
    next(err);
  }
}
