import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: "", maxlength: 8000 },
    semester: { type: Schema.Types.ObjectId, ref: "Semester" },
    subject: { type: Schema.Types.ObjectId, ref: "Subject" },
    assignedDate: { type: Date, default: Date.now },
    deadline: { type: Date, required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
    remarks: { type: String, default: "", maxlength: 4000 },
    attachmentKey: { type: String, default: null },
    attachmentName: { type: String, default: null },
    attachmentSize: { type: Number, default: 0 },
    favorite: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

schema.index({ owner: 1, isDeleted: 1, deadline: 1 });
export const Assignment = mongoose.model("Assignment", schema);
