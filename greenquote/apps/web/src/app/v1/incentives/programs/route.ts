import { NextRequest } from "next/server";
import { connectDatabase } from "@/server/db";
import { jsonResponse, errorResponse } from "@/server/auth/session";
import { incentiveService } from "@/server/modules/incentives/incentive.service";

export async function GET(_req: NextRequest) {
  try {
    await connectDatabase();
    const programs = await incentiveService.getAllPrograms();
    return jsonResponse({ programs });
  } catch (err) {
    return errorResponse("INTERNAL_ERROR", (err as Error).message, 500);
  }
}
