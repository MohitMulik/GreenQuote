import { Request, Response, NextFunction } from "express";
import { prequalService } from "./prequal.service.js";
import { PrequalificationSubmitSchema } from "@greenquote/shared";
import { PrequalificationModel } from "./prequal.model.js";

export async function submitPrequalification(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = PrequalificationSubmitSchema.parse(req.body);
    const idempotencyKey = req.headers["idempotency-key"] as string;
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    if (!req.user) {
      res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Authentication required to submit prequalification.",
      });
      return;
    }

    // Resource ownership: Homeowner can only submit for their verified quote
    if (req.user.role === "homeowner" && req.user.quoteId && req.user.quoteId !== validated.quoteId) {
      res.status(403).json({
        code: "FORBIDDEN",
        message: "You are not authorized to submit prequalification for this quote.",
      });
      return;
    }

    const result = await prequalService.submitPrequalification({
      quoteId: validated.quoteId,
      selectedTier: validated.selectedTier,
      downPaymentMinor: validated.downPaymentMinor,
      applicant: validated.applicant,
      consent: {
        ...validated.consent,
        ipAddress,
        userAgent,
      },
      idempotencyKey,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function streamOffers(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ code: "BAD_REQUEST", message: "Prequalification ID required." });
      return;
    }

    if (!req.user) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "Authentication required to stream offers." });
      return;
    }

    const prequal = await PrequalificationModel.findById(id).lean();
    if (prequal && req.user.role === "homeowner" && req.user.quoteId && req.user.quoteId !== prequal.quoteId) {
      res.status(403).json({ code: "FORBIDDEN", message: "You do not have access to these loan offers." });
      return;
    }

    // Set headers for Server-Sent Events (SSE) (FR-602)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const offers = await prequalService.getOffersForPrequal(id);

    // Stream offers progressively
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < offers.length) {
        res.write(`data: ${JSON.stringify({ type: "offer", data: offers[idx] })}\n\n`);
        idx++;
      } else {
        res.write(`data: ${JSON.stringify({ type: "complete", count: offers.length })}\n\n`);
        clearInterval(interval);
        res.end();
      }
    }, 400);

    req.on("close", () => {
      clearInterval(interval);
    });
  } catch (err) {
    next(err);
  }
}
