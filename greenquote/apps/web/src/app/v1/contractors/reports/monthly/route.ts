import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/server/db";
import { requireAuth, errorResponse } from "@/server/auth/session";
import { QuoteModel } from "@/server/modules/quotes/quote.model";
import { AppError } from "@/server/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req, ["contractor_owner", "contractor_advisor"]);
    const contractorId = user.contractorId;
    if (!contractorId) {
      throw new AppError(403, "TENANT_REQUIRED", "Contractor context required.");
    }

    await connectDatabase();
    const quotes = await QuoteModel.find({ contractorId }).sort({ createdAt: -1 }).lean();

    const headers = [
      "Quote ID",
      "Customer Name",
      "Property Address",
      "Selected Option",
      "Status",
      "Created At",
    ];

    const rows = quotes.map((q) => [
      q._id.toString(),
      `"${(q.homeowner?.fullName || "").replace(/"/g, '""')}"`,
      `"${q.property?.streetAddress || ""}, ${q.property?.city || ""}, ${q.property?.state || ""}"`,
      `"${q.options?.[0]?.title || "Standard"}"`,
      q.status,
      (q.createdAt ? new Date(q.createdAt).toISOString().slice(0, 10) : "2026-11-21"),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="greenquote_monthly_report_${new Date().toISOString().slice(0, 7)}.csv"`,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
