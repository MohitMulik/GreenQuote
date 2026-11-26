import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import jwt from "jsonwebtoken";
import { OtpChallengeModel } from "./otp.model.js";
import { QuoteModel } from "../quotes/quote.model.js";
import { config } from "../../config/index.js";
import { AppError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";

export class OtpService {
  async requestQuoteOtp(quoteToken: string, channel: "sms" | "email") {
    const quote = await QuoteModel.findOne({
      linkToken: quoteToken,
      linkExpiresAt: { $gte: new Date() },
    });
    if (!quote) {
      throw new AppError(404, "QUOTE_NOT_FOUND", "This quote link is invalid or has expired.");
    }

    const code = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OtpChallengeModel.create({
      quoteToken,
      quoteId: quote._id.toString(),
      channel,
      codeHash,
      expiresAt,
      attemptCount: 0,
    });

    logger.info({ channel, quoteId: quote._id.toString() }, "homeowner OTP issued");

    const isDevOrTest = !config.isProduction && config.nodeEnv !== "production";

    return {
      delivered: true,
      channel,
      expiresInSeconds: 600,
      ...(isDevOrTest ? { testOtp: code } : {}),
    };
  }

  async verifyQuoteOtp(quoteToken: string, code: string) {
    const challenge = await OtpChallengeModel.findOne({
      quoteToken,
      consumedAt: { $exists: false },
    }).sort({ createdAt: -1 });

    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      throw new AppError(401, "OTP_INVALID", "The verification code is invalid or expired.");
    }

    if (challenge.attemptCount >= 5) {
      throw new AppError(429, "OTP_LOCKED", "Too many verification attempts. This code is locked. Request a new code.");
    }

    challenge.attemptCount += 1;

    const matches = await bcrypt.compare(code, challenge.codeHash);
    if (!matches) {
      await challenge.save();
      if (challenge.attemptCount >= 5) {
        throw new AppError(429, "OTP_LOCKED", "Too many verification attempts. This code is locked. Request a new code.");
      }
      throw new AppError(401, "OTP_INVALID", "The verification code is invalid or expired.");
    }

    challenge.consumedAt = new Date();
    await challenge.save();

    const accessToken = jwt.sign(
      {
        userId: `hmw_${challenge.quoteId}`,
        role: "homeowner",
        quoteId: challenge.quoteId,
        type: "access",
      },
      config.jwtSecret,
      { expiresIn: "15m" }
    );

    return { accessToken, quoteId: challenge.quoteId };
  }
}

export const otpService = new OtpService();
