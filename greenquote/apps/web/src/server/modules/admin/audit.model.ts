import mongoose, { Schema, Document } from "mongoose";

export interface IAuditEventDocument extends Document {
  timestamp: Date;
  actor: {
    userId?: string;
    role: string;
    ipAddress?: string;
    userAgent?: string;
  };
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
}

const AuditEventSchema = new Schema<IAuditEventDocument>(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    actor: {
      userId: String,
      role: { type: String, required: true },
      ipAddress: String,
      userAgent: String,
    },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: false,
    capped: false,
  }
);

// Prevent updates to audit events
AuditEventSchema.pre("updateOne", function () {
  throw new Error("Audit events are immutable and cannot be updated.");
});
AuditEventSchema.pre("findOneAndUpdate", function () {
  throw new Error("Audit events are immutable and cannot be updated.");
});

export const AuditEventModel =
  mongoose.models.AuditEvent ||
  mongoose.model<IAuditEventDocument>("AuditEvent", AuditEventSchema);
