import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/server/db";
import { authService } from "@/server/modules/auth/auth.service";
import { errorResponse } from "@/server/auth/session";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const body = await req.json();
    const { mfaToken, code } = body;

    const result = await authService.verifyMfa(mfaToken, code);

    const response = NextResponse.json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
    });

    response.cookies.set("gq_access", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    response.cookies.set("gq_refresh", result.refreshToken, {
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
