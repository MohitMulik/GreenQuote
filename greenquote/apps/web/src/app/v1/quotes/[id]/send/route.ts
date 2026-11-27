import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/server/db";
import { quotesService } from "@/server/modules/quotes/quotes.service";
import { requireAuth, errorResponse } from "@/server/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDb();
    const user = requireAuth(req, ["contractor_owner", "contractor_advisor", "operations"]);
    const contractorId = user.contractorId || "cnt_default";

    const result = await quotesService.sendQuote(params.id, contractorId);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
