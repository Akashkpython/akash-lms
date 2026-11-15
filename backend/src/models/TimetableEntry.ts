import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    day: {
      type: String,
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      required: true,
    },
    subject: { type: Schema.Types.ObjectId, ref: "Subject" },
    subjectName: { type: String, required: true, trim: true, maxlength: 120 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, default: "", maxlength: 60 },
    faculty: { type: String, default: "", maxlength: 80 },
    notes: { type: String, default: "", maxlength: 1000 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

schema.index({ owner: 1, day: 1, startTime: 1 });
export const TimetableEntry = mongoose.model("TimetableEntry", schema);
