import { NextRequest } from "next/server";
import { connectDatabase } from "@/server/db";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { AuditEventModel } from "@/server/modules/admin/audit.model";

export async function GET(req: NextRequest) {
  try {
    requireAuth(req, ["operations"]);
    await connectDatabase();
    const url = new URL(req.url);
    const entityId = url.searchParams.get("entityId") || undefined;
    const action = url.searchParams.get("action") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const filter: Record<string, unknown> = {};
    if (entityId) filter["entityId"] = entityId;
    if (action) filter["action"] = action;

    const events = await AuditEventModel.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return jsonResponse({ events, count: events.length });
  } catch (err) {
    return errorResponse(err);
  }
}
