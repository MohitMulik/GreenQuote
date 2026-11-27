import { NextRequest } from "next/server";
import { connectDatabase } from "@/server/db";
import { jsonResponse, errorResponse } from "@/server/auth/session";
import { equipmentService } from "@/server/modules/equipment/equipment.service";

export async function GET(req: NextRequest) {
  try {
    await connectDatabase();
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const category = url.searchParams.get("category") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    const results = await equipmentService.searchEquipment(q, category, limit);
    return jsonResponse({ results });
  } catch (err) {
    return errorResponse("INTERNAL_ERROR", (err as Error).message, 500);
  }
}
