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


    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },

    genre: {
      type: String,
      default: "unknown",
      trim: true
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

module.exports = mongoose.model("Track", trackSchema);
