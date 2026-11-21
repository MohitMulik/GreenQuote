import mongoose from "mongoose";
import { IncentiveProgramModel } from "./incentive.model.js";
import { FALLBACK_INCENTIVES } from "../../data/catalog.js";

export interface IncentiveCalculationInput {
  state: string;
  utility?: string;
  equipmentCategory: string;
  seer2?: number;
  hspf2?: number;
  isColdClimate?: boolean;
  householdIncomeMinor?: number;
}

function mongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export class IncentiveService {
  async calculateEligibleIncentives(input: IncentiveCalculationInput): Promise<Array<{
    programmeId: string;
    name: string;
    amountMinor: number;
    paymentTiming: "instant" | "after_installation";
    conditions: string;
  }>> {
    if (!mongoReady()) {
      return FALLBACK_INCENTIVES.filter((prog) => {
        const stateOk = prog.state === input.state.toUpperCase();
        const categoryOk = prog.equipmentCategories.includes(input.equipmentCategory);
        const climateOk = !prog.requireColdClimate || Boolean(input.isColdClimate);
        return stateOk && categoryOk && climateOk;
      }).map(({ programmeId, name, amountMinor, paymentTiming, conditions }) => ({
        programmeId,
        name,
        amountMinor,
        paymentTiming,
        conditions,
      }));
    }

    const now = new Date();

    const programs = await IncentiveProgramModel.find({
      state: input.state.toUpperCase(),
      isActive: true,
      startDate: { $lte: now },
      $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }],
    }).lean();

    const eligible: Array<{
      programmeId: string;
      name: string;
      amountMinor: number;
      paymentTiming: "instant" | "after_installation";
      conditions: string;
    }> = [];

    for (const prog of programs) {
      // Check equipment category
      if (
        prog.rules.equipmentCategories.length > 0 &&
        !prog.rules.equipmentCategories.includes(input.equipmentCategory)
      ) {
        continue;
      }

      // Check cold climate requirement if specified
      if (prog.rules.requireColdClimate && !input.isColdClimate) {
        continue;
      }

      // Check minimum efficiency
      if (prog.rules.minSeer2 && (input.seer2 || 0) < prog.rules.minSeer2) {
        continue;
      }
      if (prog.rules.minHspf2 && (input.hspf2 || 0) < prog.rules.minHspf2) {
        continue;
      }

      let amount = prog.amountStructure.valueMinor;
      if (prog.amountStructure.maxCapMinor && amount > prog.amountStructure.maxCapMinor) {
        amount = prog.amountStructure.maxCapMinor;
      }

      eligible.push({
        programmeId: prog._id.toString(),
        name: prog.name,
        amountMinor: amount,
        paymentTiming: prog.paymentTiming,
        conditions: prog.paymentTiming === "instant"
          ? "Instant contractor point-of-sale deduction."
          : "Paid directly to homeowner post-installation by utility/state.",
      });
    }

    return eligible;
  }

  async getAllPrograms() {
    if (!mongoReady()) {
      return FALLBACK_INCENTIVES;
    }
    return IncentiveProgramModel.find().sort({ state: 1, name: 1 }).lean();
  }
}

export const incentiveService = new IncentiveService();
