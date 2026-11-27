import { NextRequest } from "next/server";
import { connectDatabase } from "@/server/db";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { ContractorModel } from "@/server/modules/contractors/contractor.model";
import { AuditEventModel } from "@/server/modules/admin/audit.model";
import { AppError } from "@/server/lib/errors";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(req, ["operations"]);
    const { id } = params;
    await connectDatabase();
    const body = await req.json();
    const { status, reason } = body;

    const contractor = await ContractorModel.findById(id);
    if (!contractor) {
      throw new AppError(404, "NOT_FOUND", "Contractor not found.");
    }

    contractor.status = status;
    if (status === "active") {
      contractor.kybStatus = "passed";
    }
    await contractor.save();

    await AuditEventModel.create({
      actor: { userId: user.userId, role: "operations" },
      action: `CONTRACTOR_STATUS_${status.toUpperCase()}`,
      entityType: "contractor",
      entityId: contractor._id.toString(),
      metadata: { reason },
    });

    return jsonResponse(contractor);
  } catch (err) {
    return errorResponse(err);
  }
}
