import { CookieOptions, Response } from "express";
import { config } from "../../config/index";

export const ACCESS_COOKIE = "gq_access";
export const REFRESH_COOKIE = "gq_refresh";

function baseCookie(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    path: "/",
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseCookie(),
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookie(),
    path: "/v1/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookie() });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie(), path: "/v1/auth" });
}
