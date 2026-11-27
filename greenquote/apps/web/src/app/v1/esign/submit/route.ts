import { NextRequest } from "next/server";
import { ESignSubmitSchema } from "@greenquote/shared";
import { connectDatabase } from "@/server/db";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { esignService } from "@/server/modules/esign/esign.service";

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    await connectDatabase();
    const body = await req.json();
    const validated = ESignSubmitSchema.parse(body);

    const userAgent = req.headers.get("user-agent") || "unknown-agent";
    const signerIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const record = await esignService.submitSignature({
      ...validated,
      signerIp,
      userAgent,
      authenticatedHomeownerQuoteId: user.quoteId,
    });

    return jsonResponse(
      {
        message: "Loan agreement executed successfully.",
        documentId: record._id,
        signatureHash: record.signatureHash,
        signedAt: record.signedAt,
        retentionPolicy: "7 years (FR-704 / E-SIGN compliant)",
      },
      201
    );
  } catch (err) {
    return errorResponse(err);
  }
}
