import { NextRequest } from "next/server";
import { connectDatabase } from "@/server/db";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { ContractorModel } from "@/server/modules/contractors/contractor.model";
import { AppError } from "@/server/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req, ["contractor_owner", "contractor_advisor"]);
    const contractorId = user.contractorId;
    if (!contractorId) {
      throw new AppError(403, "TENANT_REQUIRED", "Contractor context required.");
    }

    await connectDatabase();
    const contractor = await ContractorModel.findById(contractorId).lean();
    if (!contractor) {
      throw new AppError(404, "CONTRACTOR_NOT_FOUND", "Contractor not found.");
    }
    return jsonResponse({ contractor });
  } catch (err) {
    return errorResponse(err);
  }
}
