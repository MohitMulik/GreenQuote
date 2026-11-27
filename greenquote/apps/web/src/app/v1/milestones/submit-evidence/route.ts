import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDatabase } from "@/server/db";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { milestonesService } from "@/server/modules/milestones/milestones.service";

const SubmitEvidenceSchema = z.object({
  milestoneId: z.string().min(1),
  evidenceUrls: z.array(z.string()).min(1),
  installedModelNumber: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req, ["contractor_owner", "contractor_advisor"]);
    await connectDatabase();
    const body = await req.json();
    const validated = SubmitEvidenceSchema.parse(body);
    const contractorId = user.contractorId || "cnt_default";

    const milestone = await milestonesService.submitCompletionEvidence({
      ...validated,
      contractorId,
    });

    return jsonResponse(milestone);
  } catch (err) {
    return errorResponse(err);
  }
}
