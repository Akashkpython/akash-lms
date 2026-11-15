import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    semester: { type: Schema.Types.ObjectId, ref: "Semester" },
    subject: { type: Schema.Types.ObjectId, ref: "Subject" },
    topic: { type: String, default: "", maxlength: 160 },
    question: { type: String, required: true, maxlength: 8000 },
    answer: { type: String, default: "", maxlength: 20000 },
    kind: {
      type: String,
      enum: ["important", "short", "long", "viva", "definition", "notes"],
      default: "short",
    },
    important: { type: Boolean, default: false },
    tags: [{ type: String, trim: true, maxlength: 40 }],
    favorite: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

schema.index({ owner: 1, isDeleted: 1, subject: 1 });
export const ExamEntry = mongoose.model("ExamEntry", schema);
