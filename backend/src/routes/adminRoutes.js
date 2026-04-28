"use strict";

const express = require("express");

const requireAuth = require("../../middleware/requireAuth");
const CollabRequest = require("../models/CollabRequest");
const Comment = require("../models/Comment");
const Rating = require("../models/Rating");
const Report = require("../models/Report");
const Track = require("../models/Track");
const TrackVote = require("../models/TrackVote");
const User = require("../models/User");
const { removeStoredFile: removeStoredAudioFile } = require("../utils/audioStorage");
const { removeStoredFile: removeStoredMediaFile } = require("../utils/mediaStorage");
const { jsonError } = require("../utils/http");
const { trackDto, commentDto } = require("../utils/serializers");

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return jsonError(res, 403, "FORBIDDEN", "Admin access required.");
  }
  return next();
}

router.use(requireAuth, requireAdmin);

function adminUserDto(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role || "user",
    moderationStatus: user.moderationStatus || "active",
    warningCount: Number(user.warningCount || 0),
    moderationReason: user.moderationReason || "",
    interests: user.interests || [],
    avatarUrl: user.avatarUrl || null,
    createdAt: user.createdAt,
  };
}

async function deleteUserUploads(userId) {
  const trackQuery = Track.find({ userId });
  const tracks = trackQuery && typeof trackQuery.lean === "function" ? await trackQuery.lean() : [];
  const trackIds = tracks.map((track) => track._id);
  const trackIdStrings = trackIds.map((id) => id.toString());

  await Promise.all(tracks.map((track) => removeStoredAudioFile(track.storagePath, track.storageProvider, track.storageResourceType)));

  await Promise.all([
    CollabRequest.deleteMany({ trackId: { $in: trackIds } }),
    Comment.deleteMany({ trackId: { $in: trackIdStrings } }),
    Rating.deleteMany({ trackId: { $in: trackIdStrings } }),
    TrackVote.deleteMany({ trackId: { $in: trackIds } }),
    Report.deleteMany({ trackId: { $in: trackIds } }),
    Track.deleteMany({ userId }),
  ]);

  return tracks.length;
}

router.get("/overview", async (req, res) => {
  try {
    const [userCount, sampleCount, demoCount, commentCount, ratingCount, openReportCount, playStats] = await Promise.all([
      User.countDocuments({}),
      Track.countDocuments({ kind: "sample" }),
      Track.countDocuments({ kind: "demo" }),
      Comment.countDocuments({}),
      Rating.countDocuments({}),
      Report.countDocuments({ status: "open" }),
      Track.aggregate([
        {
          $group: {
            _id: null,
            totalPlays: { $sum: "$playCount" },
            totalUpvotes: { $sum: "$upvoteCount" },
            totalDownvotes: { $sum: "$downvoteCount" },
          },
        },
      ]),
    ]);

    const totals = playStats[0] || {};
    return res.json({
      userCount,
      sampleCount,
      demoCount,
      commentCount,
      ratingCount,
      openReportCount,
      totalPlays: Number(totals.totalPlays || 0),
      totalUpvotes: Number(totals.totalUpvotes || 0),
      totalDownvotes: Number(totals.totalDownvotes || 0),
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load admin overview.");
  }
});

router.get("/reports", async (req, res) => {
  try {
    const status = String(req.query.status || "").trim().toLowerCase();
    const query = ["open", "reviewed", "dismissed", "actioned"].includes(status) ? { status } : {};
    const reports = await Report.find(query).sort({ createdAt: -1 }).limit(100).lean();
    return res.json({
      items: reports.map((report) => ({
        id: report._id.toString(),
        targetType: report.targetType || "upload",
        trackId: report.trackId.toString(),
        trackTitle: report.trackTitle,
        trackKind: report.trackKind || "demo",
        trackOwnerId: report.trackOwnerId,
        trackOwnerUsername: report.trackOwnerUsername,
        commentId: report.commentId ? report.commentId.toString() : null,
        commentText: report.commentText || "",
        commentAuthorId: report.commentAuthorId || "",
        commentAuthorUsername: report.commentAuthorUsername || "",
        reporterId: report.reporterId,
        reporterUsername: report.reporterUsername,
        reason: report.reason,
        details: report.details || "",
        status: report.status,
        resolutionNote: report.resolutionNote || "",
        resolvedBy: report.resolvedBy || "",
        resolvedAt: report.resolvedAt,
        createdAt: report.createdAt,
      })),
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load reports.");
  }
});

router.patch("/reports/:id", async (req, res) => {
  try {
    const status = String((req.body && req.body.status) || "").trim().toLowerCase();
    const resolutionNote = String((req.body && req.body.resolutionNote) || "").trim().slice(0, 500);
    if (!["reviewed", "dismissed", "actioned"].includes(status)) {
      return jsonError(res, 400, "VALIDATION_ERROR", "Report status is not valid.");
    }

    const report = await Report.findByIdAndUpdate(
      String(req.params.id),
      {
        status,
        resolutionNote,
        resolvedBy: req.user.username,
        resolvedAt: new Date(),
      },
      { new: true }
    ).lean().catch(() => null);

    if (!report) {
      return jsonError(res, 404, "REPORT_NOT_FOUND", "Report not found.");
    }

    return res.json({ ok: true });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to update report.");
  }
});

router.patch("/users/:id/moderation", async (req, res) => {
  try {
    const action = String((req.body && req.body.action) || "").trim().toLowerCase();
    const reason = String((req.body && req.body.reason) || "").trim().slice(0, 300);
    const user = await User.findById(String(req.params.id));
    if (!user) {
      return jsonError(res, 404, "USER_NOT_FOUND", "User not found.");
    }
    if (user.role === "admin" && action === "ban") {
      return jsonError(res, 400, "VALIDATION_ERROR", "Admin users cannot be banned from this panel.");
    }

    if (action === "warn") {
      const nextWarningCount = Number(user.warningCount || 0) + 1;
      user.warningCount = nextWarningCount;
      user.moderationReason = reason || "Warned by moderation.";
      if (nextWarningCount >= 2) {
        user.moderationStatus = "banned";
        user.moderationReason = reason || "Banned after two moderation warnings.";
        await deleteUserUploads(user._id.toString());
      } else {
        user.moderationStatus = "warned";
      }
    } else if (action === "ban") {
      user.moderationStatus = "banned";
      user.moderationReason = reason || "Banned by moderation.";
      await deleteUserUploads(user._id.toString());
    } else if (action === "clear") {
      user.moderationStatus = "active";
      user.moderationReason = "";
    } else {
      return jsonError(res, 400, "VALIDATION_ERROR", "Moderation action is not valid.");
    }

    await user.save();
    return res.json({ ok: true, user: adminUserDto(user) });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to update user moderation.");
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const userId = String(req.params.id);
    if (userId === req.user.id) {
      return jsonError(res, 400, "VALIDATION_ERROR", "Admins cannot delete their own account from this panel.");
    }

    const user = await User.findById(userId);
    if (!user) {
      return jsonError(res, 404, "USER_NOT_FOUND", "User not found.");
    }
    if (user.role === "admin") {
      return jsonError(res, 400, "VALIDATION_ERROR", "Admin users cannot be deleted from this panel.");
    }

    const deletedTrackCount = await deleteUserUploads(userId);
    await removeStoredMediaFile(user.avatarStoragePath, user.avatarStorageProvider, user.avatarStorageResourceType);

    const userComments = await Comment.find({ userId }).select("_id").lean();
    const userCommentIds = userComments.map((comment) => comment._id);

    await Promise.all([
      Comment.deleteMany({
        $or: [
          { userId },
          { parentId: { $in: userCommentIds } },
        ],
      }),
      Rating.deleteMany({ userId }),
      TrackVote.deleteMany({ userId }),
      CollabRequest.deleteMany({
        $or: [
          { requesterId: userId },
          { trackOwnerId: userId },
        ],
      }),
      Report.deleteMany({
        $or: [
          { reporterId: userId },
          { trackOwnerId: userId },
        ],
      }),
    ]);

    await User.deleteOne({ _id: user._id });

    return res.json({
      ok: true,
      deleted: {
        users: 1,
        tracks: deletedTrackCount,
      },
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to delete user.");
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ items: users.map(adminUserDto) });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load users.");
  }
});

router.get("/tracks", async (req, res) => {
  try {
    const tracks = await Track.find({}).sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ items: tracks.map(trackDto) });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load tracks.");
  }
});

router.get("/comments", async (req, res) => {
  try {
    const comments = await Comment.find({}).sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ items: comments.map(commentDto) });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load comments.");
  }
});

router.delete("/tracks/:id", async (req, res) => {
  try {
    const track = await Track.findById(String(req.params.id));
    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }

    await removeStoredAudioFile(track.storagePath, track.storageProvider, track.storageResourceType);
    await Promise.all([
      Comment.deleteMany({ trackId: track._id.toString() }),
      Rating.deleteMany({ trackId: track._id.toString() }),
      TrackVote.deleteMany({ trackId: track._id }),
    ]);
    await Track.deleteOne({ _id: track._id });

    return res.json({ ok: true });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to delete track.");
  }
});

router.delete("/comments/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(String(req.params.id));
    if (!comment) {
      return jsonError(res, 404, "COMMENT_NOT_FOUND", "Comment not found.");
    }

    comment.isDeleted = true;
    comment.text = "This comment was deleted by moderation.";
    comment.deletedAt = new Date();
    await comment.save();

    return res.json({ ok: true });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to delete comment.");
  }
});

module.exports = router;
