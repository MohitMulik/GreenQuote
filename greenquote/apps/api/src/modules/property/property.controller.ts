import { Request, Response } from "express";
import { verifyPropertyOwnership, PropertyTitleVerificationRequest } from "./property.service.js";

export async function checkOwnership(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as PropertyTitleVerificationRequest;

    if (!body.applicantName || !body.propertyAddress || !body.propertyAddress.street) {
      res.status(400).json({
        success: false,
        error: "Missing applicantName or propertyAddress",
      });
      return;
    }

    const result = verifyPropertyOwnership(body);
    res.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Title verification failed";
    res.status(500).json({
      success: false,
      error: message,
    });
  }
}
