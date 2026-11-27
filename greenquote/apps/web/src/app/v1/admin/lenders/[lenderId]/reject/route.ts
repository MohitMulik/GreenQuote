import { NextRequest } from "next/server";
import { connectDatabase } from "@/server/db";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { mockLenders } from "@/server/modules/admin/lenders.data";
import { AuditEventModel } from "@/server/modules/admin/audit.model";
import { AppError } from "@/server/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: { lenderId: string } }
) {
  try {
    const user = requireAuth(req, ["operations"]);
    const { lenderId } = params;
    if (!lenderId || !mockLenders[lenderId]) {
      throw new AppError(404, "LENDER_NOT_FOUND", "Lender not found.");
    }

    const lender = mockLenders[lenderId];
    if (!lender.pendingChange) {
      throw new AppError(400, "NO_PENDING_CHANGE", "No pending configuration changes found for this lender.");
    }

    await connectDatabase();
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Rejected by compliance officer";
    const rejectorId = user.userId || "operations_2";

    const rejectedChange = lender.pendingChange;
    delete lender.pendingChange;

    await AuditEventModel.create({
      actor: { userId: rejectorId, role: "operations" },
      action: "LENDER_CONFIG_REJECTED",
      entityType: "lender",
      entityId: lenderId,
      metadata: {
        rejectedBy: rejectorId,
        proposedBy: rejectedChange.proposedBy,
        reason,
        previousValues: rejectedChange.previousValues,
        proposedValues: {
          newBaseAprPct: rejectedChange.newBaseAprPct,
          newMaxLoanAmountMinor: rejectedChange.newMaxLoanAmountMinor,
        },
      },
    });

    return jsonResponse({
      message: "Lender configuration change rejected. Previous parameters preserved.",
      lender,
      rejectedChange,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
