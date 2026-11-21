import { Request, Response, NextFunction } from "express";
import { equipmentService } from "./equipment.service.js";

export async function searchEquipment(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query["q"] as string) || "";
    const category = req.query["category"] as string | undefined;
    const limit = parseInt((req.query["limit"] as string) || "10", 10);

    const results = await equipmentService.searchEquipment(q, category, limit);
    res.json({ results });
  } catch (err) {
    next(err);
  }
}

export async function getEquipmentById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ code: "BAD_REQUEST", message: "ID is required." });
      return;
    }
    const item = await equipmentService.getById(id);
    if (!item) {
      res.status(404).json({ code: "NOT_FOUND", message: "Equipment not found." });
      return;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
}
