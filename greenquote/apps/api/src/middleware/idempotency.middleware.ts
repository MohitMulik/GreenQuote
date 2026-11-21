import { Request, Response, NextFunction } from "express";

export function requireIdempotencyKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers["idempotency-key"];
  if (!key || typeof key !== "string" || key.trim().length < 8) {
    res.status(400).json({
      code: "IDEMPOTENCY_KEY_REQUIRED",
      message: "Financial mutations require an Idempotency-Key header.",
    });
    return;
  }
  next();
}
