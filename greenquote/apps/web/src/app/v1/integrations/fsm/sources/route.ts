import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      providers: [
        {
          id: "jobber",
          name: "Jobber",
          webhookEvents: ["quote.created", "quote.approved", "job.completed"],
          status: "active",
        },
        {
          id: "servicetitan",
          name: "ServiceTitan",
          webhookEvents: ["estimate.exported", "job.status_change"],
          status: "active",
        },
        {
          id: "housecall_pro",
          name: "Housecall Pro",
          webhookEvents: ["estimate.sent", "estimate.accepted"],
          status: "active",
        },
      ],
    },
  });
}
