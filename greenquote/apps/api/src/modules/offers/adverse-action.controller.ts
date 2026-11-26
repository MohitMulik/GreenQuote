import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { adverseActionService } from "./adverse-action.service.js";
import { PrequalificationModel } from "../prequal/prequal.model.js";

export async function getAdverseActionNotice(req: Request, res: Response, next: NextFunction) {
  try {
    const { prequalificationId } = req.params;
    if (!prequalificationId) {
      res.status(400).json({ code: "BAD_REQUEST", message: "prequalificationId is required." });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Authentication required to view adverse action notices.",
      });
      return;
    }

    if (prequalificationId !== "preq_declined_sample" && mongoose.Types.ObjectId.isValid(prequalificationId)) {
      const prequal = await PrequalificationModel.findById(prequalificationId).lean();
      if (prequal && req.user.role === "homeowner" && req.user.quoteId && req.user.quoteId !== prequal.quoteId) {
        res.status(403).json({
          code: "FORBIDDEN",
          message: "You do not have access to this adverse action notice.",
        });
        return;
      }
    }

    const notice = await adverseActionService.generateNotice(prequalificationId);
    res.json({ notice });
  } catch (err) {
    next(err);
  }
}
