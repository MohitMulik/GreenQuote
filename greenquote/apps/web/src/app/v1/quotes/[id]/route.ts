import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/server/db";
import { quotesService } from "@/server/modules/quotes/quotes.service";
import { requireAuth, errorResponse } from "@/server/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDb();
    const user = requireAuth(req, ["contractor_owner", "contractor_advisor", "operations"]);
    const contractorId = user.role === "operations" ? undefined : user.contractorId;

    const quote = await quotesService.getQuoteById(params.id, contractorId);
    if (!quote) {
      return NextResponse.json({ code: "NOT_FOUND", message: "Quote not found." }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (err) {
    return errorResponse(err);
  }
}
