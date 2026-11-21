import { Request, Response, NextFunction } from "express";
import { incentiveService } from "./incentive.service.js";

export async function calculateIncentives(req: Request, res: Response, next: NextFunction) {
  try {
    const state = (req.query["state"] as string) || "MA";
    const category = (req.query["category"] as string) || "heat_pump";
    const utility = req.query["utility"] as string | undefined;
    const seer2 = req.query["seer2"] ? parseFloat(req.query["seer2"] as string) : undefined;
    const isColdClimate = req.query["coldClimate"] === "true";

    const incentives = await incentiveService.calculateEligibleIncentives({
      state,
      utility,
      equipmentCategory: category,
      seer2,
      isColdClimate,
    });

    const totalMinor = incentives.reduce((sum, item) => sum + item.amountMinor, 0);

    res.json({
      totalMinor,
      incentives,
    });
  } catch (err) {
    next(err);
  }
}

export async function listIncentivePrograms(_req: Request, res: Response, next: NextFunction) {
  try {
    const programs = await incentiveService.getAllPrograms();
    res.json({ programs });
  } catch (err) {
    next(err);
  }
}
