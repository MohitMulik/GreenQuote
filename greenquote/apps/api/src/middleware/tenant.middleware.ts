import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export function requireContractorTenant(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.user?.contractorId;
  if (!tenantId) {
    res.status(403).json({
      code: "TENANT_REQUIRED",
      message: "This action requires a contractor organization context.",
    });
    return;
  }
  req.tenantId = tenantId;
  next();
}

export function assertSameTenant(resourceContractorId: string | undefined, tenantId: string): void {
  if (!resourceContractorId || resourceContractorId !== tenantId) {
    throw new AppError(403, "TENANT_ISOLATION_VIOLATION", "Resource is not accessible in this organization.");
  }
}

export function stripCreditFields<T extends Record<string, unknown>>(payload: T): T {
  const blocked = new Set([
    "ssnLastFour",
    "ssnLastFourEncrypted",
    "dateOfBirth",
    "dateOfBirthEncrypted",
    "annualIncomeMinor",
    "annualIncomeEncrypted",
    "creditScore",
    "applicant",
  ]);
  const clone: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!blocked.has(key)) {
      clone[key] = value;
    }
  }
  return clone as T;
}
