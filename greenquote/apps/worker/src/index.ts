import { Agenda } from "agenda";
import dotenv from "dotenv";
import pino from "pino";
import { registerJobs } from "./jobs/index.js";

dotenv.config();

const logger = pino({ name: "greenquote-worker" });
const mongoUri = process.env["MONGODB_URI"] || "mongodb://127.0.0.1:27017/greenquote";

async function main() {
  const agenda = new Agenda({
    db: { address: mongoUri, collection: "agendaJobs" },
    processEvery: "30 seconds",
  });

  registerJobs(agenda, logger);

  agenda.on("ready", () => {
    logger.info("Agenda connected and ready");
  });
  agenda.on("error", (err: unknown) => {
    logger.error({ err }, "Agenda error");
  });

  try {
    await agenda.start();
    await agenda.every("5 minutes", "heartbeat");
    logger.info("GreenQuote worker started");
  } catch (err) {
    logger.warn({ err }, "Worker could not connect to MongoDB; retrying via Agenda");
  }
}

main().catch((err) => {
  logger.error({ err }, "Fatal worker startup error");
  process.exit(1);
});
