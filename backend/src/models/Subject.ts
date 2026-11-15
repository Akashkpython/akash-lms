import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    semester: { type: Schema.Types.ObjectId, ref: "Semester", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, trim: true, maxlength: 40 },
    color: { type: String, trim: true, maxlength: 20 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

schema.index({ owner: 1, semester: 1, name: 1 });
export const Subject = mongoose.model("Subject", schema);
