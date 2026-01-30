const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    trackId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: false, index: true },
    author: { type: String, trim: true, default: "anonymous", maxlength: 40 },
    text: { type: String, required: true, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

commentSchema.index({ trackId: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", commentSchema);
