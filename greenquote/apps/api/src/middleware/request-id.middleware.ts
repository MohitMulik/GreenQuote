import { Request, Response, NextFunction } from "express";
import { requestId } from "../lib/ids.js";

export function attachRequestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers["x-request-id"] as string) || requestId();
  req.headers["x-request-id"] = id;
  res.setHeader("X-Request-Id", id);
  next();
}
