import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    clerkUserId: {
      type: String,
      unique: true,
    },
    role: {
      type: String,
      enum: ["buyer", "supplier", "admin"],
      default: "supplier",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;