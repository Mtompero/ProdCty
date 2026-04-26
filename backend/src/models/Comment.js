const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    trackId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    parentRatingId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    userId: { type: String, required: false, index: true },
    author: { type: String, trim: true, default: "anonymous", maxlength: 40 },
    category: {
      type: String,
      enum: ["arrangement", "mix", "sound-design", "performance", "general"],
      default: "general",
      index: true,
    },
    timestampSec: { type: Number, default: null, min: 0 },
    text: { type: String, required: true, trim: true, maxlength: 500 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

commentSchema.index({ trackId: 1, createdAt: -1 });
commentSchema.index({ parentId: 1, createdAt: 1 });
commentSchema.index({ parentRatingId: 1, createdAt: 1 });

module.exports = mongoose.model("Comment", commentSchema);
