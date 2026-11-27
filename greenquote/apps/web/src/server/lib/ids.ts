import { randomBytes } from "node:crypto";

export function randomId(size = 12): string {
  return randomBytes(Math.ceil(size / 2)).toString("hex").slice(0, size);
}

export function requestId(): string {
  return `req_${randomId(12)}`;
}

export function prefixedId(prefix: string): string {
  return `${prefix}_${randomId(12)}`;
}
