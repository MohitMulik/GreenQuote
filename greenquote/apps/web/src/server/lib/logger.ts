import pino from "pino";
import { config } from "../config/index";

export const logger = pino({
  name: "greenquote-api",
  level: config.nodeEnv === "test" ? "silent" : config.isProduction ? "info" : "debug",
});
