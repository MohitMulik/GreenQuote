import { NextRequest } from "next/server";
import { connectDatabase } from "@/server/db";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { esignService } from "@/server/modules/esign/esign.service";
import { AppError } from "@/server/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: { offerId: string } }
) {
  try {
    const user = requireAuth(req);
    const { offerId } = params;
    if (!offerId) {
      throw new AppError(400, "BAD_REQUEST", "offerId is required");
    }

    await connectDatabase();
    const record = await esignService.getEsignRecord(offerId);
    if (!record) {
      throw new AppError(404, "NOT_FOUND", "E-signature record not found");
    }

    if (user.role === "homeowner" && user.quoteId && user.quoteId !== record.quoteId) {
      throw new AppError(403, "FORBIDDEN", "You are not authorized to view this document.");
    }

    if (
      (user.role === "contractor_owner" || user.role === "contractor_advisor") &&
      user.contractorId
    ) {
      if (record.contractorId !== user.contractorId) {
        throw new AppError(403, "FORBIDDEN", "Document belongs to another contractor organization.");
      }
    }

    return jsonResponse({ record });
  } catch (err) {
    return errorResponse(err);
  }
}
