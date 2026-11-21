import { Request, Response, NextFunction } from "express";
import { adverseActionService } from "./adverse-action.service.js";

export async function getAdverseActionNotice(req: Request, res: Response, next: NextFunction) {
  try {
    const { prequalificationId } = req.params;
    if (!prequalificationId) {
      res.status(400).json({ code: "BAD_REQUEST", message: "prequalificationId is required." });
      return;
    }

    const notice = await adverseActionService.generateNotice(prequalificationId);
    res.json({ notice });
  } catch (err) {
    next(err);
  }
}
