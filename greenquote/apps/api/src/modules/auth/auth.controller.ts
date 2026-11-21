import { Request, Response, NextFunction } from "express";
import {
  LoginSchema,
  MfaVerifySchema,
  RegisterContractorSchema,
  HomeownerRequestOtpSchema,
  HomeownerVerifyOtpSchema,
} from "@greenquote/shared";
import { authService } from "./auth.service.js";
import { otpService } from "./otp.service.js";
import { ACCESS_COOKIE, REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from "./auth.cookies.js";

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() || req.ip || "127.0.0.1";
  return req.ip || "127.0.0.1";
}

function applySession(
  res: Response,
  result: Awaited<ReturnType<typeof authService.login>>
): void {
  if (result.mfaRequired) {
    res.status(200).json(result);
    return;
  }
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.status(200).json({
    mfaRequired: false,
    user: result.user,
  });
}

export async function registerContractor(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = RegisterContractorSchema.parse(req.body);
    const result = await authService.registerContractor({
      ...validated,
      ipAddress: clientIp(req),
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const result = await authService.login(email, password);
    applySession(res, result);
  } catch (err) {
    next(err);
  }
}

export async function verifyMfa(req: Request, res: Response, next: NextFunction) {
  try {
    const { mfaToken, code } = MfaVerifySchema.parse(req.body);
    const result = await authService.verifyMfa(mfaToken, code);
    applySession(res, result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = (req.cookies?.[REFRESH_COOKIE] as string | undefined) || req.body?.refreshToken;
    if (!token) {
      res.status(401).json({ code: "REFRESH_REQUIRED", message: "Refresh token missing." });
      return;
    }
    const result = await authService.refresh(token);
    applySession(res, result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await authService.logout(token);
    clearAuthCookies(res);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function requestHomeownerOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { quoteToken, channel } = HomeownerRequestOtpSchema.parse(req.body);
    const result = await otpService.requestQuoteOtp(quoteToken, channel);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function verifyHomeownerOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { quoteToken, code } = HomeownerVerifyOtpSchema.parse(req.body);
    const result = await otpService.verifyQuoteOtp(quoteToken, code);
    res.cookie(ACCESS_COOKIE, result.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });
    res.status(200).json({ verified: true, quoteId: result.quoteId });
  } catch (err) {
    next(err);
  }
}
