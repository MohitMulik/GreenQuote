import mongoose from "mongoose";
import { EquipmentModel, IEquipmentDocument } from "./equipment.model.js";
import { FALLBACK_EQUIPMENT } from "../../data/catalog.js";

function mongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}

function filterCatalog(query: string, category?: string, limit: number = 10) {
  const q = query.trim().toLowerCase();
  return FALLBACK_EQUIPMENT.filter((item) => {
    const categoryOk = !category || item.category === category;
    const textOk =
      !q ||
      item.brand.toLowerCase().includes(q) ||
      item.modelNumber.toLowerCase().includes(q);
    return categoryOk && textOk;
  }).slice(0, limit);
}

export class EquipmentService {
  async searchEquipment(query: string, category?: string, limit: number = 10) {
    if (!mongoReady()) {
      return filterCatalog(query, category, limit);
    }

    const filter: Record<string, unknown> = {};

    if (category) {
      filter["category"] = category;
    }

    if (query && query.trim().length > 0) {
      const regex = new RegExp(query.trim(), "i");
      filter["$or"] = [{ brand: regex }, { modelNumber: regex }];
    }

    const items = await EquipmentModel.find(filter)
      .limit(limit)
      .sort({ brand: 1, modelNumber: 1 })
      .lean();

    return items.length > 0 ? items : filterCatalog(query, category, limit);
  }

  async getById(id: string) {
    if (!mongoReady()) {
      return FALLBACK_EQUIPMENT.find((item) => item._id === id) ?? null;
    }
    return EquipmentModel.findById(id).lean();
  }

  async verifyAhriMatch(modelNumber: string): Promise<{
    matched: boolean;
    equipment?: IEquipmentDocument;
    certifiedRatings?: Record<string, unknown>;
  }> {
    const equipment = await EquipmentModel.findOne({
      modelNumber: new RegExp(`^${modelNumber.trim()}$`, "i"),
    });

    if (!equipment) {
      return { matched: false };
    }

    return {
      matched: true,
      equipment,
      certifiedRatings: equipment.ratings,
    };
  }
}

export const equipmentService = new EquipmentService();
