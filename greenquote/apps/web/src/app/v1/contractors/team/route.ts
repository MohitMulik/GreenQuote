import { NextRequest } from "next/server";
import { connectDatabase } from "@/server/db";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { UserModel } from "@/server/modules/auth/user.model";
import { AppError } from "@/server/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req, ["contractor_owner"]);
    const contractorId = user.contractorId;
    if (!contractorId) {
      throw new AppError(403, "TENANT_REQUIRED", "Contractor context required.");
    }

    await connectDatabase();
    const users = await UserModel.find({ contractorId })
      .select("-passwordHash -mfaSecret")
      .lean();
    return jsonResponse({ users, count: users.length });
  } catch (err) {
    return errorResponse(err);
  }
}
