import { Request, Response, NextFunction } from "express";
import { milestonesService } from "./milestones.service.js";
import { z } from "zod";

const SubmitEvidenceSchema = z.object({
  milestoneId: z.string().min(1),
  evidenceUrls: z.array(z.string()).min(1),
  installedModelNumber: z.string().min(2),
});

const ConfirmHomeownerSchema = z.object({
  milestoneId: z.string().min(1),
  confirmed: z.literal(true),
});

const RescindSchema = z.object({
  milestoneId: z.string().min(1),
  reason: z.string().min(3).max(300),
  acknowledgement: z.literal(true),
});

export async function submitEvidence(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = SubmitEvidenceSchema.parse(req.body);
    const contractorId = req.user?.contractorId || "cnt_default";

    const milestone = await milestonesService.submitCompletionEvidence({
      ...validated,
      contractorId,
    });

    res.json(milestone);
  } catch (err) {
    next(err);
  }
}

export async function confirmHomeowner(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = ConfirmHomeownerSchema.parse(req.body);
    const homeownerId = req.user?.userId || "hmw_anonymous";
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

    const milestone = await milestonesService.confirmHomeownerCompletion({
      milestoneId: validated.milestoneId,
      homeownerId,
      ipAddress,
    });

    res.json(milestone);
  } catch (err) {
    next(err);
  }
}

export async function exerciseRescission(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = RescindSchema.parse(req.body);
    const homeownerId = req.user?.userId || "hmw_homeowner";
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

    const milestone = await milestonesService.exerciseRescission({
      milestoneId: validated.milestoneId,
      homeownerId,
      reason: validated.reason,
      ipAddress,
    });

    res.json({
      message: "Right of rescission exercised successfully. Loan financing cancelled.",
      milestone,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMilestones(req: Request, res: Response, next: NextFunction) {
  try {
    const { loanId } = req.params;
    if (!loanId) {
      res.status(400).json({ code: "BAD_REQUEST", message: "Loan ID required." });
      return;
    }
    const milestones = await milestonesService.getMilestonesByLoan(loanId);
    res.json({ milestones });
  } catch (err) {
    next(err);
  }
}
