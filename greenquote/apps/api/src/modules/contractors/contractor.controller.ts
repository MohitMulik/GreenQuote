import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { ContractorModel } from "./contractor.model.js";
import { UserModel } from "../auth/user.model.js";
import { QuoteModel } from "../quotes/quote.model.js";
import { AuditEventModel } from "../admin/audit.model.js";
import { AppError } from "../../lib/errors.js";

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const contractorId = req.tenantId || req.user?.contractorId;
    if (!contractorId) {
      throw new AppError(403, "TENANT_REQUIRED", "Contractor context required.");
    }
    const contractor = await ContractorModel.findById(contractorId).lean();
    if (!contractor) {
      throw new AppError(404, "CONTRACTOR_NOT_FOUND", "Contractor not found.");
    }
    res.json({ contractor });
  } catch (err) {
    next(err);
  }
}

export async function listTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const contractorId = req.tenantId || req.user?.contractorId;
    if (!contractorId) {
      throw new AppError(403, "TENANT_REQUIRED", "Contractor context required.");
    }
    const users = await UserModel.find({ contractorId })
      .select("-passwordHash -mfaSecret")
      .lean();
    res.json({ users, count: users.length });
  } catch (err) {
    next(err);
  }
}

export async function inviteTeamMember(req: Request, res: Response, next: NextFunction) {
  try {
    const contractorId = req.tenantId || req.user?.contractorId;
    if (!contractorId) {
      throw new AppError(403, "TENANT_REQUIRED", "Contractor context required.");
    }
    const { fullName, email, role } = req.body;

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

    // Default temporary password
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
      actor: { userId: req.user?.userId, role: req.user?.role, contractorId },
      action: "TEAM_MEMBER_INVITED",
      entityType: "user",
      entityId: newUser._id.toString(),
      contractorId,
      payload: { invitedEmail: email, role },
    });

    res.status(201).json({
      message: "Advisor invited successfully.",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function exportMonthlyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const contractorId = req.tenantId || req.user?.contractorId;
    if (!contractorId) {
      throw new AppError(403, "TENANT_REQUIRED", "Contractor context required.");
    }

    const quotes = await QuoteModel.find({ contractorId }).sort({ createdAt: -1 }).lean();

    const headers = [
      "Quote ID",
      "Customer Name",
      "Property Address",
      "Selected Option",
      "Status",
      "Created At",
    ];

    const rows = quotes.map((q) => [
      q._id.toString(),
      `"${q.homeowner.fullName.replace(/"/g, '""')}"`,
      `"${q.property.streetAddress}, ${q.property.city}, ${q.property.state}"`,
      `"${q.options[0]?.title || "Standard"}"`,
      q.status,
      (q.createdAt ? new Date(q.createdAt).toISOString().slice(0, 10) : "2026-11-21"),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="greenquote_monthly_report_${new Date().toISOString().slice(0, 7)}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}
