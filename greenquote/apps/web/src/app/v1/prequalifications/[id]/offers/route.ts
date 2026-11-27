import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/server/db";
import { prequalService } from "@/server/modules/prequal/prequal.service";
import { requireAuth, errorResponse } from "@/server/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDb();
    requireAuth(req);
    const offers = await prequalService.getOffersForPrequal(params.id);
    return NextResponse.json({ offers });
  } catch (err) {
    return errorResponse(err);
  }
}
