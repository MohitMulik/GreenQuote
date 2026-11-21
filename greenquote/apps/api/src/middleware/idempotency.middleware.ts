import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

interface CachedResponse {
  fingerprint: string;
  statusCode: number;
  body: unknown;
  timestamp: number;
}

// In-memory idempotency cache with 24-hour TTL (Stripe/Plaid FinTech standard)
const idempotencyStore = new Map<string, CachedResponse>();
const inFlightRequests = new Set<string>();

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function clearIdempotencyCache(): void {
  idempotencyStore.clear();
  inFlightRequests.clear();
}

/**
 * Computes deterministic SHA-256 fingerprint of request path and payload
 */
export function computePayloadFingerprint(path: string, body: unknown): string {
  const serialized = JSON.stringify({ path, body: body || {} });
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

/**
 * Advanced Idempotency Middleware for Financial Mutations (QG-6)
 * - Detects duplicate keys
 * - Detects concurrent in-flight requests (409 Conflict)
 * - Returns cached response directly on replay with 'Idempotent-Replay: true'
 * - Detects payload mismatch on key reuse (422 Unprocessable Entity)
 */
export function requireIdempotencyKey(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers["idempotency-key"];

  if (!key || typeof key !== "string" || key.trim().length < 8) {
    res.status(400).json({
      code: "IDEMPOTENCY_KEY_REQUIRED",
      message: "Financial mutations require an Idempotency-Key header with minimum 8 characters.",
    });
    return;
  }

  const normalizedKey = key.trim();
  const currentFingerprint = computePayloadFingerprint(req.originalUrl || req.url, req.body);

  // Check if identical request is currently processing
  if (inFlightRequests.has(normalizedKey)) {
    res.status(409).json({
      code: "CONCURRENT_MUTATION_IN_PROGRESS",
      message: "A financial mutation with this Idempotency-Key is currently being processed. Please retry shortly.",
    });
    return;
  }

  // Check existing cached responses
  const cached = idempotencyStore.get(normalizedKey);
  if (cached) {
    // Check TTL
    if (Date.now() - cached.timestamp > TTL_MS) {
      idempotencyStore.delete(normalizedKey);
    } else {
      // Validate payload fingerprint parity
      if (cached.fingerprint !== currentFingerprint) {
        res.status(422).json({
          code: "IDEMPOTENCY_KEY_PAYLOAD_MISMATCH",
          message: "Idempotency-Key has already been used with a different request payload or endpoint.",
        });
        return;
      }

      // Exact match replay: return cached response
      res.setHeader("Idempotent-Replay", "true");
      res.status(cached.statusCode).json(cached.body);
      return;
    }
  }

  // Mark in-flight
  inFlightRequests.add(normalizedKey);

  // Intercept response to store result
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown): Response {
    inFlightRequests.delete(normalizedKey);

    // Only cache successful or non-server-error responses
    if (res.statusCode < 500) {
      idempotencyStore.set(normalizedKey, {
        fingerprint: currentFingerprint,
        statusCode: res.statusCode,
        body,
        timestamp: Date.now(),
      });
    }

    return originalJson(body);
  };

  next();
}
