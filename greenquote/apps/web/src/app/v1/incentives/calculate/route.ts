import { NextRequest } from "next/server";
import { connectDatabase } from "@/server/db";
import { jsonResponse, errorResponse } from "@/server/auth/session";
import { incentiveService } from "@/server/modules/incentives/incentive.service";

export async function GET(req: NextRequest) {
  try {
    await connectDatabase();
    const url = new URL(req.url);
    const state = url.searchParams.get("state") || "MA";
    const category = url.searchParams.get("category") || "heat_pump";
    const utility = url.searchParams.get("utility") || undefined;
    const seer2Str = url.searchParams.get("seer2");
    const seer2 = seer2Str ? parseFloat(seer2Str) : undefined;
    const isColdClimate = url.searchParams.get("coldClimate") === "true";

    const incentives = await incentiveService.calculateEligibleIncentives({
      state,
      utility,
      equipmentCategory: category,
      seer2,
      isColdClimate,
    });

    const totalMinor = incentives.reduce((sum, item) => sum + item.amountMinor, 0);

    return jsonResponse({
      totalMinor,
      incentives,
    });
  } catch (err) {
    return errorResponse("INTERNAL_ERROR", (err as Error).message, 500);
  }
}
