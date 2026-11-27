import mongoose from "mongoose";
import { MilestoneModel, IMilestoneDocument } from "./milestone.model";
import { QuoteModel } from "../quotes/quote.model";
import { AuditEventModel } from "../admin/audit.model";
import { isRescissionPeriodActive } from "./rescission";
import { AppError } from "../../lib/errors";

function mongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export class MilestonesService {
  async submitCompletionEvidence(data: {
    milestoneId: string;
    contractorId: string;
    evidenceUrls: string[];
    installedModelNumber: string;
  }): Promise<IMilestoneDocument> {
    const milestone = await MilestoneModel.findOne({
      _id: data.milestoneId,
      contractorId: data.contractorId,
    });

    if (!milestone) {
      throw new Error("Milestone not found.");
    }

    // AI-04 / Equipment verification check
    // Ensure installed model matches quoted model
    const quote = await QuoteModel.findOne({ contractorId: data.contractorId }).sort({ createdAt: -1 });
    let modelMatched = true;
    if (quote) {
      const quotedModels = quote.options.flatMap((o: any) =>
        o.lineItems.filter((l: any) => l.type === "equipment").map((l: any) => l.label.toLowerCase())
      );
      const isPresent = quotedModels.some((m: any) =>
        m.includes(data.installedModelNumber.toLowerCase()) || data.installedModelNumber.toLowerCase().includes(m)
      );
      if (!isPresent) {
        modelMatched = false; // Flag for operations review (FR-1001)
      }
    }

    milestone.evidenceUrls = data.evidenceUrls;
    milestone.equipmentVerified = modelMatched;
    milestone.status = "submitted";
    await milestone.save();

    await AuditEventModel.create({
      actor: { role: "contractor_owner" },
      action: "COMPLETION_EVIDENCE_SUBMITTED",
      entityType: "milestone",
      entityId: milestone._id.toString(),
      metadata: { modelMatched, installedModelNumber: data.installedModelNumber },
    });

    return milestone;
  }

  async confirmHomeownerCompletion(data: {
    milestoneId: string;
    homeownerId: string;
    ipAddress?: string;
  }): Promise<IMilestoneDocument> {
    const milestone = await MilestoneModel.findById(data.milestoneId);
    if (!milestone) {
      throw new Error("Milestone not found.");
    }

    if (
      milestone.homeownerId &&
      milestone.homeownerId !== data.homeownerId &&
      data.homeownerId !== "operations" &&
      !data.homeownerId.startsWith("ops_")
    ) {
      throw new AppError(403, "FORBIDDEN", "You are not authorized to confirm this milestone.");
    }

    if (milestone.status !== "submitted") {
      throw new Error("Milestone is not ready for homeowner confirmation.");
    }

    milestone.homeownerConfirmedAt = new Date();

    // Check statutory 3-business-day cooling-off / rescission period (CMP-07, CMP-08, FR-805)
    const isCoolingOff = isRescissionPeriodActive(milestone.rescissionPeriodEndsAt);

    if (isCoolingOff) {
      // Homeowner has signed off, but payout is held until rescission window expires
      milestone.status = "confirmed_by_homeowner";
      milestone.holdReason = `Statutory 3-business-day cooling-off / rescission period active until ${milestone.rescissionPeriodEndsAt?.toISOString()} (CMP-07 / CMP-08 / FR-805)`;
      await milestone.save();

      await AuditEventModel.create({
        actor: { role: "homeowner", ipAddress: data.ipAddress },
        action: "HOMEOWNER_COMPLETION_CONFIRMED",
        entityType: "milestone",
        entityId: milestone._id.toString(),
        metadata: {
          coolingOffActive: true,
          rescissionPeriodEndsAt: milestone.rescissionPeriodEndsAt,
          holdReason: milestone.holdReason,
        },
      });
    } else {
      // Rescission period expired or not active: Payout Release Request to Lender (FR-804)
      milestone.status = "payout_released";
      milestone.payoutReleasedAt = new Date();
      milestone.holdReason = undefined;
      await milestone.save();

      await AuditEventModel.create({
        actor: { role: "homeowner", ipAddress: data.ipAddress },
        action: "HOMEOWNER_COMPLETION_CONFIRMED",
        entityType: "milestone",
        entityId: milestone._id.toString(),
        metadata: { payoutReleasedAmountMinor: milestone.amountMinor },
      });
    }

    return milestone;
  }

  /**
   * Homeowner exercises statutory Right of Rescission within 3-business-day cooling-off window (CMP-07, CMP-08, FR-805)
   */
  async exerciseRescission(data: {
    milestoneId: string;
    homeownerId: string;
    reason: string;
    ipAddress?: string;
  }): Promise<IMilestoneDocument> {
    const milestone = await MilestoneModel.findById(data.milestoneId);
    if (!milestone) {
      throw new Error("Milestone not found.");
    }

    if (
      milestone.homeownerId &&
      milestone.homeownerId !== data.homeownerId &&
      data.homeownerId !== "operations" &&
      !data.homeownerId.startsWith("ops_")
    ) {
      throw new AppError(403, "FORBIDDEN", "You are not authorized to rescind this loan.");
    }

    if (!isRescissionPeriodActive(milestone.rescissionPeriodEndsAt)) {
      throw new Error(
        "Statutory right of rescission window has expired. Rescissions must be requested within 3 business days of signing (Reg Z §1026.23)."
      );
    }

    milestone.status = "held";
    milestone.rescissionStatus = "rescinded";
    milestone.rescindedAt = new Date();
    milestone.rescindReason = data.reason;
    milestone.holdReason = "Statutory Right of Rescission exercised by homeowner (FTC Cooling-Off / TILA Reg Z).";
    await milestone.save();

    await AuditEventModel.create({
      actor: { userId: data.homeownerId, role: "homeowner", ipAddress: data.ipAddress },
      action: "HOMEOWNER_RESCISSION_EXERCISED",
      entityType: "milestone",
      entityId: milestone._id.toString(),
      metadata: {
        reason: data.reason,
        rescindedAt: milestone.rescindedAt,
      },
    });

    return milestone;
  }

  async getMilestonesByLoan(loanId: string) {
    if (!mongoReady()) {
      return [
        {
          _id: "mls_mock_1",
          loanId,
          contractorId: "cnt_mock",
          homeownerId: "+16175550188",
          type: "final_completion",
          amountMinor: 1386000,
          status: "pending",
          evidenceUrls: [],
          equipmentVerified: false,
          rescissionStatus: "active",
        },
      ];
    }
    return MilestoneModel.find({ loanId }).lean();
  }
}

export const milestonesService = new MilestonesService();
