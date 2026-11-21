import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env["PORT"] || "4000", 10),
  nodeEnv: process.env["NODE_ENV"] || "development",
  mongoUri: process.env["MONGODB_URI"] || "mongodb://127.0.0.1:27017/greenquote",
  jwtSecret: process.env["JWT_SECRET"] || "greenquote_dev_secret_key_32_characters_minimum!!",
  jwtRefreshSecret: process.env["JWT_REFRESH_SECRET"] || "greenquote_dev_refresh_secret_32_chars_min!!",
  jwtExpiresIn: "15m" as const,
  corsOrigin: process.env["CORS_ORIGIN"] || "http://localhost:3000",
  isProduction: process.env["NODE_ENV"] === "production",
  piiEncryptionKey:
    process.env["PII_ENCRYPTION_KEY"] || "greenquote_dev_pii_vault_key_do_not_use_in_prod",
};
