const mongoose = require("mongoose");

const trackVoteSchema = new mongoose.Schema(
  {
    trackId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userId: { type: String, required: true, index: true },
    value: { type: Number, enum: [-1, 1], required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

trackVoteSchema.index({ trackId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("TrackVote", trackVoteSchema);
