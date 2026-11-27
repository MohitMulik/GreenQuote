import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/server/db";
import { authService } from "@/server/modules/auth/auth.service";
import { errorResponse } from "@/server/auth/session";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Email and password are required." },
        { status: 400 }
      );
    }

    const result = await authService.login(email, password);

    if ("mfaRequired" in result && result.mfaRequired) {
      return NextResponse.json(result);
    }

    const response = NextResponse.json({
      success: true,
      user: (result as any).user,
      accessToken: (result as any).tokens?.accessToken,
    });

    const tokens = (result as any).tokens;
    if (tokens?.accessToken) {
      response.cookies.set("gq_access", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60, // 15 mins
      });
    }

    if (tokens?.refreshToken) {
      response.cookies.set("gq_refresh", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
