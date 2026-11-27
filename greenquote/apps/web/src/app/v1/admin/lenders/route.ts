import { NextRequest } from "next/server";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { mockLenders } from "@/server/modules/admin/lenders.data";

export async function GET(req: NextRequest) {
  try {
    requireAuth(req, ["operations"]);
    return jsonResponse({ lenders: Object.values(mockLenders) });
  } catch (err) {
    return errorResponse(err);
  }
}
