import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import { UserModel, IUserDocument } from "./user.model";
import { RefreshTokenModel } from "./refresh-token.model";
import { ContractorModel } from "../contractors/contractor.model";
import { config } from "../../config/index";
import { AppError } from "../../lib/errors";
import { hashIdentifier } from "../../security/pii-vault";
import { prefixedId } from "../../lib/ids";

interface RegisterInput {
  legalName: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  ein?: string;
  businessAddress: { street: string; city: string; state: string; pinCode?: string; zipCode?: string };
  owner: { fullName: string; email: string; phone: string; password: string };
  platformAgreement?: { version: string; accepted: true };
  ipAddress?: string;
}

export class AuthService {
  async registerContractor(data: RegisterInput) {
    const existingUser = await UserModel.findOne({ email: data.owner.email.toLowerCase() });
    if (existingUser) {
      throw new AppError(400, "EMAIL_EXISTS", "An account with this email already exists.");
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.owner.password, salt);
    const taxId = data.gstin || data.pan || data.ein || "DEFAULT-TAX-ID";
    const einHash = hashIdentifier(taxId);

    const contractor = await ContractorModel.create({
      legalName: data.legalName,
      tradeName: data.tradeName,
      einHash,
      businessAddress: {
        street: data.businessAddress.street,
        city: data.businessAddress.city,
        state: data.businessAddress.state,
        zipCode: data.businessAddress.pinCode || data.businessAddress.zipCode || "",
        isPoBox: false,
      },
      ownerDetails: {
        fullName: data.owner.fullName,
        email: data.owner.email,
        phone: data.owner.phone,
      },
      tradeCategories: ["hvac", "heat_pump", "solar"],
      status: "pending_review",
      platformAgreement: {
        version: data.platformAgreement?.version ?? "2026-v1",
        acceptedAt: new Date(),
        ipAddress: data.ipAddress ?? "127.0.0.1",
      },
    });

    const mfaSecret = authenticator.generateSecret();
    const user = await UserModel.create({
      fullName: data.owner.fullName,
      email: data.owner.email.toLowerCase(),
      phone: data.owner.phone,
      passwordHash,
      role: "contractor_owner",
      contractorId: contractor._id.toString(),
      mfaSecret,
      mfaEnabled: true,
      status: "active",
    });

    const otpauth = authenticator.keyuri(user.email, "GreenQuote", mfaSecret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

    return {
      contractorId: contractor._id.toString(),
      userId: user._id.toString(),
      mfaRequired: true,
      qrCodeDataUrl,
      mfaSetupUrl: otpauth,
    };
  }

  async login(email: string, passwordPlain: string) {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    if (user.status !== "active") {
      throw new AppError(403, "ACCOUNT_DEACTIVATED", "This account has been deactivated.");
    }

    if (user.mfaEnabled && user.mfaSecret) {
      const mfaToken = jwt.sign(
        { userId: user._id.toString(), purpose: "mfa" },
        config.jwtSecret,
        { expiresIn: "5m" }
      );
      return { mfaRequired: true as const, mfaToken };
    }

    return this.issueSession(user);
  }

  async verifyMfa(mfaToken: string, code: string) {
    let userId: string;
    try {
      const payload = jwt.verify(mfaToken, config.jwtSecret) as { userId: string; purpose?: string };
      if (payload.purpose !== "mfa") {
        throw new Error("wrong purpose");
      }
      userId = payload.userId;
    } catch {
      throw new AppError(401, "MFA_CHALLENGE_INVALID", "MFA challenge is invalid or expired.");
    }

    const user = await UserModel.findById(userId);
    if (!user || !user.mfaSecret) {
      throw new AppError(400, "MFA_NOT_CONFIGURED", "User or MFA configuration not found.");
    }

    const isValid = authenticator.verify({ token: code, secret: user.mfaSecret });
    if (!isValid) {
      throw new AppError(401, "MFA_INVALID", "Invalid MFA code.");
    }

    user.lastLoginAt = new Date();
    await user.save();
    return this.issueSession(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashIdentifier(refreshToken);
    const stored = await RefreshTokenModel.findOne({ tokenHash, revokedAt: { $exists: false } });
    if (!stored || stored.expiresAt.getTime() < Date.now()) {
      throw new AppError(401, "REFRESH_INVALID", "Refresh token is invalid or expired.");
    }

    const user = await UserModel.findById(stored.userId);
    if (!user || user.status !== "active") {
      throw new AppError(401, "REFRESH_INVALID", "Refresh token is invalid or expired.");
    }

    stored.revokedAt = new Date();
    await stored.save();
    return this.issueSession(user);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    const tokenHash = hashIdentifier(refreshToken);
    await RefreshTokenModel.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
  }

  private async issueSession(user: IUserDocument) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = randomBytes(32).toString("hex");
    const tokenHash = hashIdentifier(refreshToken);
    await RefreshTokenModel.create({
      userId: user._id.toString(),
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      mfaRequired: false as const,
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        contractorId: user.contractorId,
      },
    };
  }

  private generateAccessToken(user: IUserDocument): string {
    return jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        contractorId: user.contractorId,
        type: "access",
        jti: prefixedId("jti"),
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }
}

export const authService = new AuthService();
