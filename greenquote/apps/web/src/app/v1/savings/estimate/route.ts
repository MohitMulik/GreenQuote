import { NextRequest } from "next/server";
import { jsonResponse, errorResponse } from "@/server/auth/session";
import { savingsService } from "@/server/modules/savings/savings.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const category = (body.category as "heat_pump" | "solar_panel") || "heat_pump";
    const state = (body.state as string) || "MA";
    const existingFuel = body.existingFuel as string | undefined;
    const homeSizeSqFt = body.homeSizeSqFt ? parseInt(body.homeSizeSqFt, 10) : undefined;
    const solarCapacityKw = body.solarCapacityKw ? parseFloat(body.solarCapacityKw) : undefined;
    const seer2 = body.seer2 ? parseFloat(body.seer2) : undefined;

    const result = savingsService.calculateSavings({
      category,
      state,
      existingFuel,
      homeSizeSqFt,
      solarCapacityKw,
      seer2,
    });

    return jsonResponse(result);
  } catch (err) {
    return errorResponse("INTERNAL_ERROR", (err as Error).message, 500);
  }
}
