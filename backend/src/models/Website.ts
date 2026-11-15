import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    url: { type: String, required: true, trim: true, maxlength: 2000 },
    description: { type: String, default: "", maxlength: 2000 },
    notes: { type: String, default: "", maxlength: 4000 },
    tags: [{ type: String, trim: true, maxlength: 40 }],
    semester: { type: Schema.Types.ObjectId, ref: "Semester" },
    subject: { type: Schema.Types.ObjectId, ref: "Subject" },
    topic: { type: Schema.Types.ObjectId, ref: "Topic" },
    favorite: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

schema.index({ owner: 1, isDeleted: 1, createdAt: -1 });
export const Website = mongoose.model("Website", schema);
