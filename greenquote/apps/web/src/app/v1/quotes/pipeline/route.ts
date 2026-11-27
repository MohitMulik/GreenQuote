import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/server/db";
import { quotesService } from "@/server/modules/quotes/quotes.service";
import { requireAuth, errorResponse } from "@/server/auth/session";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const user = requireAuth(req, ["contractor_owner", "contractor_advisor", "operations"]);
    const contractorId = user.contractorId || "cnt_default";
    const advisorId = user.userId;
    const isOwner = user.role === "contractor_owner" || user.role === "operations";

    const pipeline = await quotesService.getContractorPipeline(contractorId, advisorId, isOwner);
    return NextResponse.json({ pipeline });
  } catch (err) {
    return errorResponse(err);
  }
}
