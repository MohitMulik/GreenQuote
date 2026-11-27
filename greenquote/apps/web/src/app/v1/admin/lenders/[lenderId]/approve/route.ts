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

    const approverId = user.userId || "operations_2";

    // Critical Dual-Authorization check: Approver cannot be the same user who proposed the change!
    if (lender.pendingChange.proposedBy === approverId) {
      try {
        await connectDatabase();
        await AuditEventModel.create({
          actor: { userId: approverId, role: "operations" },
          action: "LENDER_CONFIG_APPROVAL_FAILED",
          entityType: "lender",
          entityId: lenderId,
          metadata: {
            reason: "DUAL_AUTHORIZATION_VIOLATION_SELF_APPROVAL",
            proposedBy: lender.pendingChange.proposedBy,
            approverId,
          },
        });
      } catch {
        // Ignore audit failure on rejection
      }
      throw new AppError(
        403,
        "DUAL_AUTHORIZATION_VIOLATION",
        "Dual-authorization policy violation: The approving officer cannot be the same officer who requested the change (FR-1002)."
      );
    }

    await connectDatabase();
    const previousValues = lender.pendingChange.previousValues || {
      baseAprPct: lender.baseAprPct,
      maxLoanAmountMinor: lender.maxLoanAmountMinor,
    };
    const updatedValues = {
      baseAprPct: lender.pendingChange.newBaseAprPct,
      maxLoanAmountMinor: lender.pendingChange.newMaxLoanAmountMinor,
    };

    lender.baseAprPct = lender.pendingChange.newBaseAprPct;
    lender.maxLoanAmountMinor = lender.pendingChange.newMaxLoanAmountMinor;
    const appliedChange = lender.pendingChange;
    delete lender.pendingChange;

    await AuditEventModel.create({
      actor: { userId: approverId, role: "operations" },
      action: "LENDER_CONFIG_APPROVED",
      entityType: "lender",
      entityId: lenderId,
      metadata: {
        approvedBy: approverId,
        proposedBy: appliedChange.proposedBy,
        previousValues,
        updatedValues,
      },
    });

    return jsonResponse({
      message: "Configuration update approved and activated successfully under dual-authorization.",
      lender,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
