import { NextRequest } from "next/server";
import { jsonResponse } from "@/server/auth/session";
import { processFsmQuoteSync, FsmQuotePayload } from "@/server/modules/integrations/fsm-webhook.service";

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as FsmQuotePayload;

    if (!payload.provider || !payload.externalJobId || !payload.cashPriceCents) {
      return jsonResponse(
        {
          success: false,
          error: "Missing required FSM payload attributes (provider, externalJobId, cashPriceCents)",
        },
        400
      );
    }

    const result = processFsmQuoteSync(payload);
    return jsonResponse(
      {
        success: true,
        data: result,
      },
      201
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "FSM sync failed";
    return jsonResponse(
      {
        success: false,
        error: message,
      },
      400
    );
  }
}
