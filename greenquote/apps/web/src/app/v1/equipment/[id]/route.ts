import { NextRequest } from "next/server";
import { connectDatabase } from "@/server/db";
import { jsonResponse, errorResponse } from "@/server/auth/session";
import { equipmentService } from "@/server/modules/equipment/equipment.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDatabase();
    const { id } = params;
    if (!id) {
      return errorResponse("BAD_REQUEST", "ID is required.", 400);
    }
    const item = await equipmentService.getById(id);
    if (!item) {
      return errorResponse("NOT_FOUND", "Equipment not found.", 404);
    }
    return jsonResponse(item);
  } catch (err) {
    return errorResponse("INTERNAL_ERROR", (err as Error).message, 500);
  }
}
