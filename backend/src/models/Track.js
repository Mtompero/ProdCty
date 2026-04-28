const mongoose = require("mongoose");

const trackSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
      index: true,
    },
    userAvatarUrl: {
      type: String,
      default: "",
      trim: true,
    },


    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    kind: {
      type: String,
      enum: ["sample", "demo"],
      default: "sample",
      index: true
    },
    genre: {
      type: String,
      default: "unknown",
      trim: true
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500
    },
    bpm: {
      type: Number,
      default: null,
      min: 1,
      max: 400
    },
    musicalKey: {
      type: String,
      default: "",
      trim: true,
      maxlength: 16
    },
    energyLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    analysisSource: {
      type: String,
      default: "manual",
      trim: true,
      maxlength: 60,
    },
    aura: {
      primaryColor: { type: String, default: "#ff2d2d", trim: true },
      secondaryColor: { type: String, default: "#241118", trim: true },
      accentColor: { type: String, default: "#2dd4bf", trim: true },
      gradient: {
        type: String,
        default: "linear-gradient(135deg, #ff2d2d, #241118 58%, #2dd4bf)",
        trim: true,
      },
      moodLabel: { type: String, default: "Balanced unknown aura", trim: true, maxlength: 80 },
    },
    licenseLabel: {
      type: String,
      default: "Royalty-free",
      trim: true,
      maxlength: 60
    },
    durationSec: {
      type: Number,
      default: null,
      min: 1
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true
    },
    mimeType: {
      type: String,
      required: true,
      trim: true
    },
    fileSize: {
      type: Number,
      required: true,
      min: 1
    },
    audioUrl: {
      type: String,
      required: true,
      trim: true
    },
    storageProvider: {
      type: String,
      enum: ["local", "cloudinary"],
      default: "local",
      index: true
    },
    storageResourceType: {
      type: String,
      default: "auto",
      trim: true
    },
    storagePath: {
      type: String,
      required: true
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0
    },
    playCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    upvoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    downvoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    versionKey: false
  }
);

trackSchema.index({ createdAt: -1 });
trackSchema.index({ userId: 1, createdAt: -1 });
trackSchema.index({ kind: 1, createdAt: -1 });
trackSchema.index({ kind: 1, genre: 1, bpm: 1, musicalKey: 1, energyLevel: 1 });

module.exports = mongoose.model("Track", trackSchema);
