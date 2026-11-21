import mongoose, { Schema, Document } from "mongoose";
import { EquipmentCategory } from "@greenquote/shared";

export interface IEquipmentDocument extends Document {
  brand: string;
  modelNumber: string;
  ahriRefNumber?: string;
  category: EquipmentCategory;
  ratings: {
    seer2?: number;
    eer2?: number;
    hspf2?: number;
    coolingCapacityBtu?: number;
    heatingCapacityBtu?: number;
    solarWattage?: number;
  };
  isColdClimate: boolean;
  isEnergyStar: boolean;
  verificationSource: "ahri" | "neep" | "manual";
  verifiedAt: Date;
  createdAt: Date;
}

const EquipmentSchema = new Schema<IEquipmentDocument>(
  {
    brand: { type: String, required: true },
    modelNumber: { type: String, required: true, index: true },
    ahriRefNumber: { type: String, index: true },
    category: {
      type: String,
      enum: ["heat_pump", "air_conditioner", "furnace", "solar_panel", "inverter", "battery"],
      required: true,
    },
    ratings: {
      seer2: Number,
      eer2: Number,
      hspf2: Number,
      coolingCapacityBtu: Number,
      heatingCapacityBtu: Number,
      solarWattage: Number,
    },
    isColdClimate: { type: Boolean, default: false },
    isEnergyStar: { type: Boolean, default: false },
    verificationSource: { type: String, enum: ["ahri", "neep", "manual"], default: "ahri" },
    verifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

EquipmentSchema.index({ brand: "text", modelNumber: "text" });

export const EquipmentModel = mongoose.model<IEquipmentDocument>("Equipment", EquipmentSchema);
