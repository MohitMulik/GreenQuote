import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/server/db";
import { authService } from "@/server/modules/auth/auth.service";
import { errorResponse } from "@/server/auth/session";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const body = await req.json().catch(() => ({}));
    const refreshToken = body.refreshToken || req.cookies.get("gq_refresh")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { code: "TOKEN_REQUIRED", message: "Refresh token is required." },
        { status: 400 }
      );
    }

    const tokens = await authService.refresh(refreshToken);

    const response = NextResponse.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    response.cookies.set("gq_access", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    response.cookies.set("gq_refresh", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
