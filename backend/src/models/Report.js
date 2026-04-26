const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ["upload", "comment"], default: "upload", index: true },
    trackId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    trackTitle: { type: String, required: true, trim: true, maxlength: 120 },
    trackKind: { type: String, enum: ["sample", "demo"], required: true, index: true },
    trackOwnerId: { type: String, required: true, index: true },
    trackOwnerUsername: { type: String, required: true, trim: true, maxlength: 40 },
    commentId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    commentText: { type: String, default: "", trim: true, maxlength: 500 },
    commentAuthorId: { type: String, default: "", trim: true, index: true },
    commentAuthorUsername: { type: String, default: "", trim: true, maxlength: 40 },
    reporterId: { type: String, required: true, index: true },
    reporterUsername: { type: String, required: true, trim: true, maxlength: 40 },
    reason: {
      type: String,
      enum: ["spam", "harassment", "copyright", "explicit", "misleading", "other"],
      default: "other",
      index: true,
    },
    details: { type: String, default: "", trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["open", "reviewed", "dismissed", "actioned"],
      default: "open",
      index: true,
    },
    resolutionNote: { type: String, default: "", trim: true, maxlength: 500 },
    resolvedBy: { type: String, default: "", trim: true },
    resolvedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

reportSchema.index(
  { targetType: 1, trackId: 1, commentId: 1, reporterId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Report", reportSchema);
