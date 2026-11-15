import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    command: { type: String, required: true, maxlength: 4000 },
    os: { type: String, default: "", maxlength: 40 },
    description: { type: String, default: "", maxlength: 4000 },
    example: { type: String, default: "", maxlength: 4000 },
    category: {
      type: String,
      enum: ["linux", "windows_cmd", "powershell", "git", "networking", "python", "nodejs", "dev_tools"],
      required: true,
    },
    tags: [{ type: String, trim: true, maxlength: 40 }],
    favorite: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

schema.index({ owner: 1, isDeleted: 1, category: 1 });
export const TerminalCommand = mongoose.model("TerminalCommand", schema);
