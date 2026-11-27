import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/server/db";
import { authService } from "@/server/modules/auth/auth.service";
import { errorResponse } from "@/server/auth/session";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const body = await req.json();
    const result = await authService.registerContractor(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
