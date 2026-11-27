import { NextRequest } from "next/server";
import { connectDatabase } from "@/server/db";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { IncentiveProgramModel } from "@/server/modules/incentives/incentive.model";
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
    const updated = await IncentiveProgramModel.findByIdAndUpdate(id, body, { new: true });
    if (!updated) {
      throw new AppError(404, "PROGRAM_NOT_FOUND", "Incentive program not found.");
    }

    await AuditEventModel.create({
      actor: { userId: user.userId, role: "operations" },
      action: "INCENTIVE_PROGRAM_UPDATED",
      entityType: "incentive_program",
      entityId: id,
    });

    return jsonResponse(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
