import { NextRequest } from "next/server";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";
import { verifyPropertyOwnership, PropertyTitleVerificationRequest } from "@/server/modules/property/property.service";
import { AppError } from "@/server/lib/errors";

export async function POST(req: NextRequest) {
  try {
    requireAuth(req);
    const body = (await req.json()) as PropertyTitleVerificationRequest;

    if (!body.applicantName || !body.propertyAddress || !body.propertyAddress.street) {
      throw new AppError(400, "BAD_REQUEST", "Missing applicantName or propertyAddress");
    }

    const result = verifyPropertyOwnership(body);
    return jsonResponse({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
