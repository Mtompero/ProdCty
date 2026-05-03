const mongoose = require("mongoose");

const collabRequestSchema = new mongoose.Schema(
  {
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Track",
      index: true,
    },
    trackTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    trackOwnerId: {
      type: String,
      required: true,
      index: true,
    },
    trackOwnerUsername: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32,
    },
    requesterId: {
      type: String,
      required: true,
      index: true,
    },
    requesterUsername: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32,
    },
    requesterAvatarUrl: {
      type: String,
      default: "",
      trim: true,
    },
    requesterEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    skills: {
      type: [String],
      default: [],
    },
    contactPreference: {
      type: String,
      enum: ["in-app", "email", "instagram"],
      default: "in-app",
    },
    instagramHandle: {
      type: String,
      default: "",
      trim: true,
      maxlength: 64,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

collabRequestSchema.index({ trackId: 1, requesterId: 1 }, { unique: true });
collabRequestSchema.index({ trackOwnerId: 1, status: 1, createdAt: -1 });
collabRequestSchema.index({ requesterId: 1, createdAt: -1 });

module.exports = mongoose.model("CollabRequest", collabRequestSchema);
