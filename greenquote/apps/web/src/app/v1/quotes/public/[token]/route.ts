import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDb } from "@/server/db";
import { config } from "@/server/config";
import { quotesService } from "@/server/modules/quotes/quotes.service";
import { QuoteModel } from "@/server/modules/quotes/quote.model";
import { errorResponse } from "@/server/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    await connectDb();
    const { token } = params;

    if (!token) {
      return NextResponse.json({ code: "BAD_REQUEST", message: "Token required." }, { status: 400 });
    }

    let isVerified = false;
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("gq_access")?.value;
    const candidateToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : cookieToken;

    if (candidateToken) {
      try {
        const decoded = jwt.verify(candidateToken, config.jwtSecret) as {
          quoteId?: string;
          contractorId?: string;
          role?: string;
        };
        const quoteMeta = await QuoteModel.findOne({ linkToken: token }).select("_id contractorId").lean() as any;
        if (quoteMeta) {
          if (
            decoded.quoteId === quoteMeta._id.toString() ||
            decoded.contractorId === quoteMeta.contractorId ||
            decoded.role === "operations"
          ) {
            isVerified = true;
          }
        }
      } catch {
        // Token invalid or expired: remain unverified
      }
    }

    const quote = await quotesService.getQuoteByToken(token, isVerified);
    return NextResponse.json(quote);
  } catch (err) {
    return errorResponse(err);
  }
}
