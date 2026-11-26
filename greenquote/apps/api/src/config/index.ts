import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env["NODE_ENV"] === "production";

// In production, validate critical secrets and fail-fast if insecure or missing
if (isProduction) {
  const missingSecrets: string[] = [];

  const jwtSecret = process.env["JWT_SECRET"];
  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.includes("dev_secret")) {
    missingSecrets.push("JWT_SECRET (must be at least 32 characters and cannot use default dev secret)");
  }

  const jwtRefresh = process.env["JWT_REFRESH_SECRET"];
  if (!jwtRefresh || jwtRefresh.length < 32 || jwtRefresh.includes("dev_refresh")) {
    missingSecrets.push("JWT_REFRESH_SECRET (must be at least 32 characters and cannot use default dev secret)");
  }

  const piiKey = process.env["PII_ENCRYPTION_KEY"];
  if (!piiKey || piiKey.length < 32 || piiKey.includes("dev_pii")) {
    missingSecrets.push("PII_ENCRYPTION_KEY (must be at least 32 characters and cannot use default dev secret)");
  }

  const mongoUri = process.env["MONGODB_URI"] || process.env["MONGO_URI"];
  if (!mongoUri) {
    missingSecrets.push("MONGODB_URI (mandatory production database connection string)");
  }

  if (missingSecrets.length > 0) {
    throw new Error(
      `CRITICAL PRODUCTION SECURITY CONFIGURATION ERROR:\nThe following mandatory environment variables are missing or insecure:\n- ${missingSecrets.join(
        "\n- "
      )}\nApplication startup aborted.`
    );
  }
}

export const config = {
  port: parseInt(process.env["PORT"] || "4000", 10),
  nodeEnv: process.env["NODE_ENV"] || "development",
  mongoUri:
    process.env["MONGODB_URI"] ||
    process.env["MONGO_URI"] ||
    "mongodb://127.0.0.1:27017/greenquote",
  jwtSecret: process.env["JWT_SECRET"] || "greenquote_dev_secret_key_32_characters_minimum!!",
  jwtRefreshSecret: process.env["JWT_REFRESH_SECRET"] || "greenquote_dev_refresh_secret_32_chars_min!!",
  jwtExpiresIn: "15m" as const,
  corsOrigin: process.env["CORS_ORIGIN"] || "http://localhost:3000",
  isProduction,
  piiEncryptionKey:
    process.env["PII_ENCRYPTION_KEY"] || "greenquote_dev_pii_vault_key_do_not_use_in_prod",
  adminSeedSecret: process.env["ADMIN_SEED_SECRET"],
};
