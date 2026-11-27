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

    await connectDatabase();
    const body = await req.json();
    const { newBaseAprPct, newMaxLoanAmountMinor } = body;
    const userId = user.userId || "operations_1";

    const lender = mockLenders[lenderId];
    const previousValues = {
      baseAprPct: lender.baseAprPct,
      maxLoanAmountMinor: lender.maxLoanAmountMinor,
    };
    const updatedValues = {
      newBaseAprPct,
      newMaxLoanAmountMinor,
    };

    lender.pendingChange = {
      proposedBy: userId,
      proposedAt: new Date().toISOString(),
      newBaseAprPct,
      newMaxLoanAmountMinor,
      previousValues,
    };

    await AuditEventModel.create({
      actor: { userId, role: "operations" },
      action: "LENDER_CONFIG_PROPOSED",
      entityType: "lender",
      entityId: lenderId,
      metadata: {
        proposedBy: userId,
        previousValues,
        updatedValues,
      },
    });

    return jsonResponse({
      message: "Lender configuration update proposed. Awaiting dual-authorization approval.",
      lender,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
