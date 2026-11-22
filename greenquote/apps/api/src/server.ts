import mongoose from "mongoose";
import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./lib/logger.js";
import { UserModel } from "./modules/auth/user.model.js";
import { seedDatabase } from "./scripts/seed.js";

async function main() {
  const app = createApp();

  try {
    logger.info({ mongoUri: config.mongoUri }, "connecting to MongoDB");
    await mongoose.connect(config.mongoUri);
    logger.info("connected to MongoDB");

    try {
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        logger.info("Database is empty (0 users). Auto-seeding initial credentials and demo data...");
        await seedDatabase(false);
        logger.info("Database auto-seeded successfully");
      }
    } catch (seedErr) {
      logger.warn({ seedErr }, "Auto-seeding encountered an error, continuing startup");
    }
  } catch (err) {
    logger.warn({ err }, "MongoDB unavailable; catalog endpoints will use in-memory fallbacks");
  }

  app.listen(config.port, () => {
    logger.info({ port: config.port, env: config.nodeEnv }, "GreenQuote Core API listening");
  });
}

main().catch((err) => {
  logger.error({ err }, "fatal startup error");
  process.exit(1);
});
