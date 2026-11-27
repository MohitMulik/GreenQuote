import { NextRequest } from "next/server";
import { connectDatabase } from "@/server/db";
import { config } from "@/server/config";
import { jsonResponse, errorResponse } from "@/server/auth/session";

export async function POST(req: NextRequest) {
  if (config.isProduction || config.nodeEnv === "production") {
    return errorResponse("FORBIDDEN", "Database seed operations are strictly forbidden in production.", 403);
  }

  const adminKey = req.headers.get("x-admin-seed-key");
  const authHeader = req.headers.get("authorization");
  const isAuthorized =
    (Boolean(config.adminSeedSecret) && adminKey === config.adminSeedSecret) ||
    (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) ||
    config.nodeEnv === "development" ||
    config.nodeEnv === "test";

  if (!isAuthorized) {
    return errorResponse("UNAUTHORIZED", "Administrative authorization required for seed endpoint.", 401);
  }

  try {
    await connectDatabase();
    const { seedDatabase } = await import("@/server/scripts/seed");
    await seedDatabase(false);
    return jsonResponse({ success: true, message: "Database seeded successfully with demo users." });
  } catch (err) {
    return errorResponse("SEED_ERROR", (err as Error).message, 500);
  }
}
