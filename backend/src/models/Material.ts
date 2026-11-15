import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    semester: { type: Schema.Types.ObjectId, ref: "Semester", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    topic: { type: Schema.Types.ObjectId, ref: "Topic", required: true },
    fileName: { type: String, required: true, trim: true, maxlength: 180 },
    originalName: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, default: "", maxlength: 2000 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    extension: { type: String, required: true, lowercase: true },
    r2Key: { type: String, required: true },
    status: { type: String, enum: ["pending", "ready"], default: "pending" },
    favorite: { type: Boolean, default: false },
    lastAccessedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

schema.index({ owner: 1, isDeleted: 1, createdAt: -1 });
schema.index({ owner: 1, semester: 1, subject: 1, topic: 1 });
schema.index({ owner: 1, fileName: 1 });
export const Material = mongoose.model("Material", schema);
