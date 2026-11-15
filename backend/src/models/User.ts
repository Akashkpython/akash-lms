import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    theme: { type: String, enum: ["dark", "light", "system"], default: "dark" },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
