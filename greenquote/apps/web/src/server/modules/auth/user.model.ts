import mongoose, { Schema, Document } from "mongoose";
import { UserRole } from "@greenquote/shared";

export interface IUserDocument extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: UserRole;
  contractorId?: string;
  mfaSecret?: string;
  mfaEnabled: boolean;
  status: "active" | "deactivated";
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String },
    role: {
      type: String,
      enum: ["contractor_owner", "contractor_advisor", "homeowner", "lender_user", "operations"],
      required: true,
    },
    contractorId: { type: String, index: true },
    mfaSecret: { type: String },
    mfaEnabled: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "deactivated"], default: "active" },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
