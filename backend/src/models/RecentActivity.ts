import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resourceType: { type: String, required: true },
    resourceId: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true, maxlength: 180 },
    action: { type: String, required: true, maxlength: 40 },
  },
  { timestamps: true },
);

schema.index({ owner: 1, createdAt: -1 });
export const RecentActivity = mongoose.model("RecentActivity", schema);
