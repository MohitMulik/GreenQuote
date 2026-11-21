import { Request, Response, NextFunction } from "express";
import { savingsService } from "./savings.service.js";

export function estimateSavings(req: Request, res: Response, next: NextFunction) {
  try {
    const category = (req.body.category as "heat_pump" | "solar_panel") || "heat_pump";
    const state = (req.body.state as string) || "MA";
    const existingFuel = req.body.existingFuel as string | undefined;
    const homeSizeSqFt = req.body.homeSizeSqFt ? parseInt(req.body.homeSizeSqFt, 10) : undefined;
    const solarCapacityKw = req.body.solarCapacityKw ? parseFloat(req.body.solarCapacityKw) : undefined;
    const seer2 = req.body.seer2 ? parseFloat(req.body.seer2) : undefined;

    const result = savingsService.calculateSavings({
      category,
      state,
      existingFuel,
      homeSizeSqFt,
      solarCapacityKw,
      seer2,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}
