import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    content: { type: String, default: "", maxlength: 200000 },
    semester: { type: Schema.Types.ObjectId, ref: "Semester" },
    subject: { type: Schema.Types.ObjectId, ref: "Subject" },
    favorite: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

schema.index({ owner: 1, isDeleted: 1, updatedAt: -1 });
export const Note = mongoose.model("Note", schema);
