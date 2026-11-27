import { NextRequest } from "next/server";
import { connectDatabase } from "@/server/db";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { IncentiveProgramModel } from "@/server/modules/incentives/incentive.model";
import { AuditEventModel } from "@/server/modules/admin/audit.model";

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req, ["operations"]);
    await connectDatabase();
    const body = await req.json();
    const program = await IncentiveProgramModel.create(body);

    await AuditEventModel.create({
      actor: { userId: user.userId, role: "operations" },
      action: "INCENTIVE_PROGRAM_CREATED",
      entityType: "incentive_program",
      entityId: program._id.toString(),
      payload: { name: program.name, state: program.state },
    });

    return jsonResponse(program, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
