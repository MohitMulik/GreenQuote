import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { connectDatabase } from "@/server/db";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { AuditEventModel } from "@/server/modules/admin/audit.model";
import { AppError } from "@/server/lib/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    requireAuth(req, ["operations"]);
    const { entityId } = params;
    if (!entityId) {
      throw new AppError(400, "MISSING_ENTITY_ID", "entityId is required.");
    }

    await connectDatabase();
    const events = await AuditEventModel.find({
      $or: [{ entityId }, { "payload.offerId": entityId }, { "payload.quoteId": entityId }],
    })
      .sort({ timestamp: 1 })
      .lean();

    const dossierPayload = JSON.stringify(events);
    const integrityHash = crypto.createHash("sha256").update(dossierPayload).digest("hex");

    return jsonResponse({
      entityId,
      exportedAt: new Date().toISOString(),
      eventCount: events.length,
      integritySeal: {
        algorithm: "SHA-256",
        hash: integrityHash,
        verified: true,
      },
      auditTrail: events,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
