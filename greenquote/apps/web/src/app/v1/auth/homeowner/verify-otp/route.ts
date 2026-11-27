import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/server/db";
import { otpService } from "@/server/modules/auth/otp.service";
import { errorResponse } from "@/server/auth/session";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const body = await req.json();
    const { quoteToken, code } = body;

    if (!quoteToken || !code) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Quote token and verification code are required." },
        { status: 400 }
      );
    }

    const result = await otpService.verifyQuoteOtp(quoteToken, code);

    const response = NextResponse.json({
      verified: true,
      quoteId: result.quoteId,
      accessToken: result.accessToken,
    });

    response.cookies.set("gq_access", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
