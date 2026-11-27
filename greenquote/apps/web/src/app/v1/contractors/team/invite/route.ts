import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDatabase } from "@/server/db";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { UserModel } from "@/server/modules/auth/user.model";
import { AuditEventModel } from "@/server/modules/admin/audit.model";
import { AppError } from "@/server/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req, ["contractor_owner"]);
    const contractorId = user.contractorId;
    if (!contractorId) {
      throw new AppError(403, "TENANT_REQUIRED", "Contractor context required.");
    }

    await connectDatabase();
    const { fullName, email, role } = await req.json();

    if (!fullName || !email || !role) {
      throw new AppError(400, "MISSING_FIELDS", "fullName, email, and role are required.");
    }

    if (role !== "contractor_owner" && role !== "contractor_advisor") {
      throw new AppError(400, "INVALID_ROLE", "Only contractor_owner or contractor_advisor roles allowed.");
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError(409, "USER_EXISTS", "A user with this email already exists.");
    }

    const defaultPassword = "ChangeMe2026!";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const newUser = await UserModel.create({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      role,
      contractorId,
      status: "active",
      mfaEnabled: false,
    });

    await AuditEventModel.create({
      actor: { userId: user.userId, role: user.role, contractorId },
      action: "TEAM_MEMBER_INVITED",
      entityType: "user",
      entityId: newUser._id.toString(),
      contractorId,
      payload: { invitedEmail: email, role },
    });

    return jsonResponse(
      {
        message: "Advisor invited successfully.",
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
        },
      },
      201
    );
  } catch (err) {
    return errorResponse(err);
  }
}
