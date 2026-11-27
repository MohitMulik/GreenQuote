import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AppError } from "../lib/errors";

export interface AuthUser {
  userId: string;
  role: "contractor_owner" | "contractor_advisor" | "operations" | "homeowner";
  contractorId?: string;
  quoteId?: string;
}

export function getAuthToken(req: NextRequest): string | null {
  const cookieToken = req.cookies.get("gq_access")?.value;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

export function verifyAuthToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    if (payload.type && payload.type !== "access") {
      return null;
    }
    return {
      userId: payload.userId,
      role: payload.role,
      contractorId: payload.contractorId,
      quoteId: payload.quoteId,
    };
  } catch {
    return null;
  }
}

export function getAuthUser(req: NextRequest): AuthUser | null {
  const token = getAuthToken(req);
  if (!token) return null;
  return verifyAuthToken(token);
}

export function requireAuth(req: NextRequest, allowedRoles?: string[]): AuthUser {
  const user = getAuthUser(req);
  if (!user) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required to access this endpoint.");
  }
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new AppError(403, "FORBIDDEN", "Insufficient permissions for this operation.");
  }
  return user;
}

export function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

export function errorResponse(errOrCode: unknown, message?: string, status = 500) {
  if (typeof errOrCode === "string") {
    return NextResponse.json(
      { code: errOrCode, message: message || errOrCode },
      { status: typeof status === "number" ? status : 500 }
    );
  }
  if (errOrCode instanceof AppError) {
    return NextResponse.json(
      { code: errOrCode.code, message: errOrCode.message, details: errOrCode.details },
      { status: errOrCode.statusCode }
    );
  }
  const msg = errOrCode instanceof Error ? errOrCode.message : (message || "Internal server error");
  return NextResponse.json(
    { code: "INTERNAL_ERROR", message: msg },
    { status: typeof status === "number" ? status : 500 }
  );
}
