import { NextRequest } from "next/server";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { quoteImportService } from "@/server/modules/ai/quote-import.service";

export async function POST(req: NextRequest) {
  try {
    requireAuth(req, ["contractor_owner", "contractor_advisor", "operations"]);
    const body = await req.json();
    const filename = (body?.filename as string) || "uploaded_quote.pdf";
    const rawText = body?.rawText as string | undefined;

    const result = await quoteImportService.parseDocument(filename, rawText);

    return jsonResponse({
      status: "success",
      data: result,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
