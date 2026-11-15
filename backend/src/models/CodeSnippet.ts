import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    language: { type: String, required: true, trim: true, maxlength: 40 },
    code: { type: String, required: true, maxlength: 200000 },
    description: { type: String, default: "", maxlength: 4000 },
    tags: [{ type: String, trim: true, maxlength: 40 }],
    subject: { type: Schema.Types.ObjectId, ref: "Subject" },
    favorite: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

schema.index({ owner: 1, isDeleted: 1, language: 1, updatedAt: -1 });
export const CodeSnippet = mongoose.model("CodeSnippet", schema);
