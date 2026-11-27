import { NextRequest } from "next/server";
import { connectDatabase } from "@/server/db";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { milestonesService } from "@/server/modules/milestones/milestones.service";
import { AppError } from "@/server/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: { loanId: string } }
) {
  try {
    requireAuth(req);
    const { loanId } = params;
    if (!loanId) {
      throw new AppError(400, "BAD_REQUEST", "Loan ID required.");
    }

    await connectDatabase();
    const milestones = await milestonesService.getMilestonesByLoan(loanId);
    return jsonResponse(milestones);
  } catch (err) {
    return errorResponse(err);
  }
}
