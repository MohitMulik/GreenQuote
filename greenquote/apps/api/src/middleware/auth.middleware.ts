import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { UserRole } from "@greenquote/shared";
import { ACCESS_COOKIE } from "../modules/auth/auth.cookies.js";

export interface AuthenticatedUser {
  userId: string;
  email?: string;
  role: UserRole;
  contractorId?: string;
  quoteId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      homeownerQuoteId?: string;
    }
  }
}

function readAccessToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }
  const cookieToken = req.cookies?.[ACCESS_COOKIE];
  return typeof cookieToken === "string" && cookieToken.length > 0 ? cookieToken : null;
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const token = readAccessToken(req);

  if (!token) {
    res.status(401).json({
      code: "UNAUTHORIZED",
      message: "Authentication token missing.",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthenticatedUser & { type?: string };
    if (payload.type && payload.type !== "access") {
      res.status(401).json({ code: "INVALID_TOKEN", message: "Authentication token is invalid or expired." });
      return;
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      code: "INVALID_TOKEN",
      message: "Authentication token is invalid or expired.",
    });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "User not authenticated." });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        code: "FORBIDDEN",
        message: "You do not have permission to access this resource.",
      });
      return;
    }

    next();
  };
}

export function authenticateHomeowner(req: Request, res: Response, next: NextFunction): void {
  const headerToken = (req.headers["x-quote-token"] as string) || (req.query["token"] as string);
  if (req.user?.role === "homeowner" && req.user.quoteId) {
    req.homeownerQuoteId = req.user.quoteId;
    next();
    return;
  }

  if (!headerToken) {
    res.status(401).json({
      code: "QUOTE_TOKEN_REQUIRED",
      message: "Quote access token is required to view this quote.",
    });
    return;
  }

  try {
    const decoded = jwt.verify(headerToken, config.jwtSecret) as { quoteId: string };
    req.homeownerQuoteId = decoded.quoteId;
    next();
  } catch {
    res.status(403).json({
      code: "INVALID_QUOTE_TOKEN",
      message: "The quote access link is invalid or has expired.",
    });
  }
}
