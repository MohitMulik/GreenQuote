import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { config } from "../config/index";

const ALGORITHM = "aes-256-gcm";
const KEY_ID = "local-dev-v1";

function encryptionKey(): Buffer {
  const raw = config.piiEncryptionKey;
  const hashed = createHash("sha256").update(raw).digest();
  return hashed;
}

/**
 * CSFLE-compatible envelope: AES-256-GCM ciphertext with key identifier.
 * Production swaps this for MongoDB ClientEncryption.encrypt without changing callers.
 */
export function encryptPii(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `csfle:${KEY_ID}:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptPii(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 5 || parts[0] !== "csfle") {
    throw new Error("Unrecognized PII vault payload.");
  }
  const iv = Buffer.from(parts[2] ?? "", "base64url");
  const tag = Buffer.from(parts[3] ?? "", "base64url");
  const encrypted = Buffer.from(parts[4] ?? "", "base64url");
  const decipher = createDecipheriv(ALGORITHM, encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function maskLastFour(value: string): string {
  if (value.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

export function hashIdentifier(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}
