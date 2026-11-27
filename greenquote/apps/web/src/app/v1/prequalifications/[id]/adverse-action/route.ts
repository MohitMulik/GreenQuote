import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/server/db";
import { adverseActionService } from "@/server/modules/offers/adverse-action.service";
import { requireAuth, errorResponse } from "@/server/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDb();
    requireAuth(req);
    const notice = await adverseActionService.generateNotice(params.id);
    if (!notice) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Adverse action notice not found." }, { status: 404 });
    }
    return NextResponse.json({ notice });
  } catch (err) {
    return errorResponse(err);
  }
}
