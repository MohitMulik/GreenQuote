import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const requestId = (req.headers["x-request-id"] as string) || "req_unknown";
  const timestamp = new Date().toISOString();

  if (err instanceof ZodError) {
    res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "The request body failed schema validation.",
      requestId,
      timestamp,
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      requestId,
      timestamp,
      details: err.details,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST");
  const message =
    statusCode >= 500 && process.env["NODE_ENV"] === "production"
      ? "An unexpected internal error occurred."
      : err.message;

  if (statusCode >= 500) {
    logger.error({ err, requestId }, "unhandled api error");
  }

  res.status(statusCode).json({
    code,
    message,
    requestId,
    timestamp,
    details: err.details,
  });
}
