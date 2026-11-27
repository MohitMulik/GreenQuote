import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/server/db";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { milestonesService } from "@/server/modules/milestones/milestones.service";

const RescindSchema = z.object({
  milestoneId: z.string().min(1),
  reason: z.string().min(3).max(300),
  acknowledgement: z.literal(true),
});

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    await connectDatabase();
    const body = await req.json();
    const validated = RescindSchema.parse(body);
    const homeownerId = user.userId;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";

    const milestone = await milestonesService.exerciseRescission({
      milestoneId: validated.milestoneId,
      homeownerId,
      reason: validated.reason,
      ipAddress,
    });

    return jsonResponse({
      message: "Right of rescission exercised successfully. Loan financing cancelled.",
      milestone,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
