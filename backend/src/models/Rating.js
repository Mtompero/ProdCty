const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    trackId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userId: { type: String, required: true, index: true },
    author: { type: String, required: true, trim: true, maxlength: 40 },
    score: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: "", trim: true, maxlength: 280 },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

ratingSchema.index({ trackId: 1, userId: 1 }, { unique: true });
ratingSchema.index({ trackId: 1, createdAt: -1 });

module.exports = mongoose.model("Rating", ratingSchema);
