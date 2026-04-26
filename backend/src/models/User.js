const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, unique: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    moderationStatus: { type: String, enum: ["active", "warned", "banned"], default: "active", index: true },
    warningCount: { type: Number, default: 0, min: 0 },
    moderationReason: { type: String, default: "", trim: true, maxlength: 300 },
    interests: { type: [String], default: [] },
    bio: { type: String, default: "", trim: true, maxlength: 240 },
    avatarUrl: { type: String, default: "", trim: true },
    avatarStoragePath: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model("User", userSchema);
