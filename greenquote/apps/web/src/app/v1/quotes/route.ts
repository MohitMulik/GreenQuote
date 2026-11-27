import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/server/db";
import { quotesService } from "@/server/modules/quotes/quotes.service";
import { requireAuth, errorResponse } from "@/server/auth/session";
import { CreateQuoteSchema } from "@greenquote/shared";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = requireAuth(req, ["contractor_owner", "contractor_advisor", "operations"]);
    const contractorId = user.contractorId || "cnt_default";
    const advisorId = user.userId;

    const body = await req.json();
    const validated = CreateQuoteSchema.parse(body);

    const quote = await quotesService.createQuote({
      ...validated,
      contractorId,
      advisorId,
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
