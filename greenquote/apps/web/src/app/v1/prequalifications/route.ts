import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/server/db";
import { prequalService } from "@/server/modules/prequal/prequal.service";
import { requireAuth, errorResponse } from "@/server/auth/session";
import { PrequalificationSubmitSchema } from "@greenquote/shared";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const idempotencyKey = req.headers.get("idempotency-key");
    if (!idempotencyKey || idempotencyKey.length < 8) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Idempotency-Key header is required and must be at least 8 characters." },
        { status: 400 }
      );
    }

    const user = requireAuth(req);
    const body = await req.json();
    const validated = PrequalificationSubmitSchema.parse(body);

    if (user.role === "homeowner" && user.quoteId && user.quoteId !== validated.quoteId) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "You are not authorized to submit prequalification for this quote." },
        { status: 403 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "NextJS Client";

    const result = await prequalService.submitPrequalification({
      quoteId: validated.quoteId,
      selectedTier: validated.selectedTier,
      downPaymentMinor: validated.downPaymentMinor,
      applicant: validated.applicant,
      consent: {
        ...validated.consent,
        ipAddress,
        userAgent,
      },
      idempotencyKey,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
