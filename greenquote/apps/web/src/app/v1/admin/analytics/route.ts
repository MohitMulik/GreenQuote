import { NextRequest } from "next/server";
import { requireAuth, jsonResponse, errorResponse } from "@/server/auth/session";

export async function GET(req: NextRequest) {
  try {
    requireAuth(req, ["operations"]);

    return jsonResponse({
      originations: {
        totalVolumeMinor: 4850000000, // ₹48.5 Crore
        totalFundedLoans: 142,
        activePipelineCount: 42,
        avgLoanAmountMinor: 23400000, // ₹2,34,000
        avgAprPct: 7.25,
        dealerFeeSavingsMinor: 873000000, // ₹8.73 Crore saved by Zero Dealer Fee Single-Price policy (FR-308)
      },
      lenderMetrics: [
        {
          lenderId: "lnd_sbi",
          name: "State Bank of India (Surya Ghar)",
          fundedVolumeMinor: 2150000000, // ₹21.5 Cr
          approvalRatePct: 78.5,
          medianTimeToOfferSec: 42,
        },
        {
          lenderId: "lnd_tata_capital",
          name: "Tata Capital Clean Energy",
          fundedVolumeMinor: 1720000000, // ₹17.2 Cr
          approvalRatePct: 74.2,
          medianTimeToOfferSec: 38,
        },
        {
          lenderId: "lnd_ireda",
          name: "IREDA Green Finance",
          fundedVolumeMinor: 980000000, // ₹9.8 Cr
          approvalRatePct: 82.1,
          medianTimeToOfferSec: 29,
        },
      ],
      technologyBreakdown: {
        heatPumpsPct: 64,
        solarPvPct: 28,
        batteryStoragePct: 8,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
