import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/server/db";
import { otpService } from "@/server/modules/auth/otp.service";
import { errorResponse } from "@/server/auth/session";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const body = await req.json();
    const { quoteToken, channel = "sms" } = body;

    if (!quoteToken) {
      return NextResponse.json(
        { code: "TOKEN_REQUIRED", message: "Quote token is required." },
        { status: 400 }
      );
    }

    const result = await otpService.requestQuoteOtp(quoteToken, channel);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
