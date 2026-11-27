import { NextRequest } from "next/server";
import { connectDatabase } from "@/server/db";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { ContractorModel } from "@/server/modules/contractors/contractor.model";
import { MilestoneModel } from "@/server/modules/milestones/milestone.model";

export async function GET(req: NextRequest) {
  try {
    requireAuth(req, ["operations"]);
    await connectDatabase();
    const pendingContractors = await ContractorModel.find({ status: "pending_review" }).lean();
    const flaggedMilestones = await MilestoneModel.find({
      status: "submitted",
      equipmentVerified: false,
    }).lean();

    return jsonResponse({
      pendingContractors,
      flaggedMilestones,
      summary: {
        contractorReviewCount: pendingContractors.length,
        fraudReviewCount: flaggedMilestones.length,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
