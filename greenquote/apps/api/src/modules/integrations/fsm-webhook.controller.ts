import { Request, Response } from "express";
import { processFsmQuoteSync, FsmQuotePayload } from "./fsm-webhook.service.js";

export async function handleFsmWebhook(req: Request, res: Response): Promise<void> {
  try {
    const payload = req.body as FsmQuotePayload;

    if (!payload.provider || !payload.externalJobId || !payload.cashPriceCents) {
      res.status(400).json({
        success: false,
        error: "Missing required FSM payload attributes (provider, externalJobId, cashPriceCents)",
      });
      return;
    }

    const result = processFsmQuoteSync(payload);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "FSM sync failed";
    res.status(400).json({
      success: false,
      error: message,
    });
  }
}

export function listSupportedFsmProviders(_req: Request, res: Response): void {
  res.json({
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
      compliance: {
        enforceCashFinancedParity: true,
        referenceRule: "FR-308 / FR-310",
      },
    },
  });
}
