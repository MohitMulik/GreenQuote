export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  mongoUri:
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/greenquote",
  jwtSecret: process.env.JWT_SECRET || "greenquote_dev_secret_key_32_characters_minimum!!",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "greenquote_dev_refresh_secret_32_chars_min!!",
  jwtExpiresIn: "15m" as const,
  piiEncryptionKey:
    process.env.PII_ENCRYPTION_KEY ||
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  adminSeedSecret: process.env.ADMIN_SEED_SECRET || "secret123",
};
