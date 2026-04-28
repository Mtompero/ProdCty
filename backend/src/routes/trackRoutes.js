"use strict";

const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");

const requireAuth = require("../../middleware/requireAuth");
const CollabRequest = require("../models/CollabRequest");
const Comment = require("../models/Comment");
const Rating = require("../models/Rating");
const Report = require("../models/Report");
const Track = require("../models/Track");
const TrackVote = require("../models/TrackVote");
const User = require("../models/User");
const {
  createAudioUploadMiddleware,
  removeStoredFile,
  storeUploadedAudio,
} = require("../utils/audioStorage");
const { analyzeTrackMetadata } = require("../utils/analysis");
const { jsonError } = require("../utils/http");
const { trackDto, commentDto } = require("../utils/serializers");
const {
  isNonEmptyString,
  normalizeGenre,
  normalizeTags,
  normalizeTrackKind,
  parseDurationSec,
  parseOptionalNumber,
  parseTimestampSec,
  sanitizeOptionalText,
  validateUploadedAudioFile,
  validateRatingScore,
} = require("../utils/validators");

const router = express.Router();
const audioUpload = createAudioUploadMiddleware();
const DRUM_TAGS = ["drum", "drums", "kick", "snare", "hihat", "hat", "clap", "rim", "perc", "percussion", "tom", "cymbal", "808"];
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 60;

function multerSingleAudio(req, res, next) {
  audioUpload.single("audio")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }
    return jsonError(res, 400, "VALIDATION_ERROR", err.message || "Audio upload failed.");
  });
}

async function rejectBannedUser(req, res) {
  const user = await User.findById(req.user.id).select("moderationStatus moderationReason").lean().catch(() => null);
  if (user && user.moderationStatus === "banned") {
    jsonError(res, 403, "ACCOUNT_BANNED", user.moderationReason || "This account is banned.");
    return true;
  }
  return false;
}

async function updateTrackVoteSummary(trackId) {
  const objectId = typeof trackId === "string" ? new mongoose.Types.ObjectId(trackId) : trackId;
  const aggregate = await TrackVote.aggregate([
    { $match: { trackId: objectId } },
    {
      $group: {
        _id: "$trackId",
        upvotes: { $sum: { $cond: [{ $eq: ["$value", 1] }, 1, 0] } },
        downvotes: { $sum: { $cond: [{ $eq: ["$value", -1] }, 1, 0] } },
      },
    },
  ]);

  const summary = aggregate[0] || { upvotes: 0, downvotes: 0 };
  await Track.findByIdAndUpdate(objectId, {
    upvoteCount: Number(summary.upvotes || 0),
    downvoteCount: Number(summary.downvotes || 0),
  });

  return {
    upvoteCount: Number(summary.upvotes || 0),
    downvoteCount: Number(summary.downvotes || 0),
  };
}

async function getUserMetaById(userIds) {
  const ids = [...new Set((userIds || []).map((id) => String(id || "")).filter(Boolean))];
  if (!ids.length) return new Map();

  const users = await User.find({ _id: { $in: ids } }).select("_id username avatarUrl").lean().catch(() => []);
  return new Map(users.map((user) => [
    String(user._id),
    {
      username: user.username || "",
      avatarUrl: user.avatarUrl || "",
    },
  ]));
}

function parsePage(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return parsed;
}

function parseLimit(value, fallback = DEFAULT_PAGE_SIZE) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_PAGE_SIZE);
}

function buildPageMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

function buildTrackSort(sortBy) {
  switch (String(sortBy || "").trim().toLowerCase()) {
    case "upvotes":
      return { upvoteCount: -1, downvoteCount: 1, createdAt: -1 };
    case "plays":
      return { playCount: -1, createdAt: -1 };
    case "rating":
      return { ratingAverage: -1, ratingCount: -1, createdAt: -1 };
    case "oldest":
      return { createdAt: 1 };
    case "latest":
    default:
      return { createdAt: -1 };
  }
}

router.get("/feed", async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, DEFAULT_PAGE_SIZE);
    const page = parsePage(req.query.page);
    const query = { kind: "demo" };
    const [total, items] = await Promise.all([
      Track.countDocuments(query),
      Track.find(query)
        .sort(buildTrackSort("latest"))
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return res.json({
      items: items.map(trackDto),
      meta: buildPageMeta(total, page, limit),
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load feed.");
  }
});

router.get("/feed/for-you", async (req, res) => {
  try {
    const interests = normalizeTags(req.query.interests || "");
    const limit = parseLimit(req.query.limit, 18);
    const query = { kind: "demo" };
    const items = await Track.find(query).sort({ createdAt: -1 }).limit(MAX_PAGE_SIZE).lean();

    const scored = items
      .map((track) => {
        let score = Number(track.playCount || 0) + Number(track.ratingCount || 0) * 3;
        const trackTokens = new Set(normalizeTags([track.genre, ...(track.tags || []), track.energyLevel, track.musicalKey]));
        interests.forEach((interest) => {
          if (trackTokens.has(interest)) score += 8;
        });
        if (track.energyLevel === "high") score += 1;
        return { track, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => trackDto(item.track));

    return res.json({
      items: scored,
      meta: buildPageMeta(scored.length, 1, limit),
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load the For You feed.");
  }
});

router.get("/tracks", async (req, res) => {
  try {
    const userId = req.query.userId ? String(req.query.userId) : null;
    const kind = req.query.kind ? normalizeTrackKind(req.query.kind) : null;
    const q = String(req.query.q || "").trim().toLowerCase();
    const genre = req.query.genre ? normalizeGenre(req.query.genre) : null;
    const musicalKey = sanitizeOptionalText(req.query.key || "", 16);
    const energyLevel = sanitizeOptionalText(req.query.energy || "", 16).toLowerCase();
    const bpmMin = parseOptionalNumber(req.query.bpmMin, 1, 400);
    const bpmMax = parseOptionalNumber(req.query.bpmMax, 1, 400);
    const tags = normalizeTags(req.query.tags || "");
    const sort = buildTrackSort(req.query.sort);
    const page = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit);
    const query = {};
    const andFilters = [];

    if (userId) {
      query.userId = userId;
    }
    if (kind) {
      query.kind = kind;
    }
    if (genre) {
      andFilters.push({ $or: [{ genre }, { tags: genre }] });
    }
    if (musicalKey) {
      query.musicalKey = musicalKey;
    }
    if (["low", "medium", "high"].includes(energyLevel)) {
      query.energyLevel = energyLevel;
    }
    if (bpmMin || bpmMax) {
      query.bpm = {};
      if (bpmMin) query.bpm.$gte = bpmMin;
      if (bpmMax) query.bpm.$lte = bpmMax;
    }
    if (tags.length) {
      query.tags = { $in: tags };
    }
    if (q) {
      const qTags = ["drum", "drums"].includes(q) ? DRUM_TAGS : [q];
      andFilters.push({
        $or: [
          { title: { $regex: q, $options: "i" } },
          { username: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { genre: { $in: qTags } },
          { tags: { $in: qTags } },
        ],
      });
    }
    if (andFilters.length) {
      query.$and = andFilters;
    }

    const [total, items] = await Promise.all([
      Track.countDocuments(query),
      Track.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return res.json({
      items: items.map(trackDto),
      meta: buildPageMeta(total, page, limit),
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load tracks.");
  }
});

router.get("/demos", async (req, res) => {
  try {
    const page = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit);
    const sort = buildTrackSort(req.query.sort);
    const query = { kind: "demo" };
    const [total, items] = await Promise.all([
      Track.countDocuments(query),
      Track.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return res.json({
      items: items.map(trackDto),
      meta: buildPageMeta(total, page, limit),
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load demos.");
  }
});

router.get("/tracks/:id", async (req, res) => {
  try {
    const track = await Track.findById(String(req.params.id)).lean().catch(() => null);
    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }
    return res.json(trackDto(track));
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load track.");
  }
});

router.post("/tracks/:id/play", async (req, res) => {
  try {
    const track = await Track.findByIdAndUpdate(
      String(req.params.id),
      { $inc: { playCount: 1 } },
      { new: true }
    ).lean().catch(() => null);

    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }

    return res.json({
      ok: true,
      playCount: Number(track.playCount || 0),
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to register play.");
  }
});

router.get("/tracks/:id/stream", async (req, res) => {
  try {
    const track = await Track.findById(String(req.params.id)).lean().catch(() => null);
    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }
    if (track.storageProvider === "cloudinary" && track.audioUrl) {
      return res.redirect(track.audioUrl);
    }

    const stats = await fs.promises.stat(track.storagePath);
    const mimeType = track.mimeType || "audio/mpeg";
    const range = req.headers.range;

    if (!range) {
      res.writeHead(200, {
        "Content-Type": mimeType,
        "Content-Length": stats.size,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      });
      return fs.createReadStream(track.storagePath).pipe(res);
    }

    const [startRaw, endRaw] = String(range).replace(/bytes=/, "").split("-");
    const start = Number(startRaw);
    const end = endRaw ? Number(endRaw) : stats.size - 1;

    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end >= stats.size || start > end) {
      return jsonError(res, 416, "INVALID_RANGE", "Requested byte range is not valid.");
    }

    res.writeHead(206, {
      "Content-Type": mimeType,
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${stats.size}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    });
    return fs.createReadStream(track.storagePath, { start, end }).pipe(res);
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to stream track.");
  }
});

router.get("/tracks/:id/download", async (req, res) => {
  try {
    const track = await Track.findById(String(req.params.id)).lean().catch(() => null);
    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }
    if (track.kind !== "sample") {
      return jsonError(res, 403, "FORBIDDEN", "Demo tracks cannot be downloaded.");
    }
    if (track.storageProvider === "cloudinary" && track.audioUrl) {
      res.setHeader("Content-Disposition", `attachment; filename="${String(track.originalFileName || "sample").replace(/"/g, "")}"`);
      return res.redirect(track.audioUrl);
    }

    return res.download(track.storagePath, track.originalFileName);
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to download track.");
  }
});

router.delete("/tracks/:id", requireAuth, async (req, res) => {
  try {
    const track = await Track.findById(String(req.params.id));
    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }
    if (track.userId !== req.user.id) {
      return jsonError(res, 403, "FORBIDDEN", "You can only delete your own tracks.");
    }

    await removeStoredFile(track.storagePath, track.storageProvider, track.storageResourceType);
    await CollabRequest.deleteMany({ trackId: track._id });
    await Comment.deleteMany({ trackId: track._id.toString() });
    await Rating.deleteMany({ trackId: track._id.toString() });
    await TrackVote.deleteMany({ trackId: track._id });
    await Track.deleteOne({ _id: track._id });

    return res.json({ ok: true });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to delete track.");
  }
});

async function handleTrackVote(req, res) {
  try {
    if (await rejectBannedUser(req, res)) return;

    const trackId = String(req.params.id);
    const value = Number(req.body && req.body.value);

    if (!mongoose.Types.ObjectId.isValid(trackId)) {
      return jsonError(res, 400, "VALIDATION_ERROR", "Track id is not valid.");
    }

    const track = await Track.findById(trackId).lean().catch(() => null);

    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }
    if (![1, -1, 0].includes(value)) {
      return jsonError(res, 400, "VALIDATION_ERROR", "Vote value must be 1, -1 or 0.");
    }

    if (value === 0) {
      await TrackVote.deleteOne({ trackId: track._id, userId: req.user.id });
    } else {
      await TrackVote.findOneAndUpdate(
        { trackId: track._id, userId: req.user.id },
        {
          trackId: track._id,
          userId: req.user.id,
          value,
          updatedAt: new Date(),
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    const summary = await updateTrackVoteSummary(trackId);
    return res.json({ ok: true, ...summary });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to save vote.");
  }
}

router.post("/tracks/:id/vote", requireAuth, handleTrackVote);
router.post("/api/tracks/:id/vote", requireAuth, handleTrackVote);

router.post("/tracks/:id/reports", requireAuth, async (req, res) => {
  try {
    if (await rejectBannedUser(req, res)) return;

    const trackId = String(req.params.id);
    const reasonRaw = String((req.body && req.body.reason) || "other").trim().toLowerCase();
    const details = sanitizeOptionalText(req.body ? req.body.details : "", 500);
    const reason = ["spam", "harassment", "copyright", "explicit", "misleading", "other"].includes(reasonRaw)
      ? reasonRaw
      : "other";

    const track = await Track.findById(trackId).lean().catch(() => null);
    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }
    if (track.userId === req.user.id) {
      return jsonError(res, 400, "VALIDATION_ERROR", "You cannot report your own upload.");
    }

    const report = await Report.findOneAndUpdate(
      { trackId: track._id, reporterId: req.user.id },
      {
        trackId: track._id,
        targetType: "upload",
        trackTitle: track.title,
        trackKind: track.kind,
        trackOwnerId: track.userId,
        trackOwnerUsername: track.username,
        reporterId: req.user.id,
        reporterUsername: req.user.username,
        reason,
        details,
        status: "open",
        createdAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ ok: true, reportId: report._id.toString() });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to report demo.");
  }
});

router.post("/tracks", requireAuth, multerSingleAudio, async (req, res) => {
  try {
    if (await rejectBannedUser(req, res)) {
      await removeStoredFile(req.file && req.file.path);
      return;
    }

    const title = req.body && req.body.title ? String(req.body.title) : "";
    const genreTags = normalizeTags(req.body ? req.body.genre : "");
    const genre = genreTags[0] || normalizeGenre(req.body ? req.body.genre : "");
    const kind = normalizeTrackKind(req.body ? req.body.kind : "");
    const description = sanitizeOptionalText(req.body ? req.body.description : "", 500);
    const musicalKey = sanitizeOptionalText(req.body ? req.body.musicalKey : "", 16);
    const bpm = parseOptionalNumber(req.body ? req.body.bpm : null, 1, 400);
    const durationSec = parseDurationSec(req.body ? req.body.durationSec : null);
    const audioCheck = validateUploadedAudioFile(req.file);

    if (!isNonEmptyString(title)) {
      await removeStoredFile(req.file && req.file.path);
      return jsonError(res, 400, "VALIDATION_ERROR", "title is required.");
    }
    if (!audioCheck.ok) {
      await removeStoredFile(req.file && req.file.path);
      return jsonError(res, 400, "VALIDATION_ERROR", audioCheck.message);
    }

    const storedAudio = await storeUploadedAudio(req.file);
    const analysis = analyzeTrackMetadata({
      title,
      originalFileName: storedAudio.originalFileName,
      genre,
      bpm,
      musicalKey,
      durationSec,
      kind,
      username: req.user.username,
    });

    const explicitTags = normalizeTags(req.body ? req.body.tags : "");
    const created = await Track.create({
      userId: req.user.id,
      username: req.user.username,
      userAvatarUrl: req.user.avatarUrl || "",
      title: title.trim(),
      kind,
      genre,
      tags: [...new Set([...analysis.tags, ...genreTags, ...explicitTags])].slice(0, 20),
      description,
      bpm: bpm || analysis.bpm,
      musicalKey: musicalKey || analysis.musicalKey,
      energyLevel: analysis.energyLevel,
      aura: analysis.aura,
      analysisSource: analysis.analysisSource,
      licenseLabel: "Royalty-free",
      durationSec,
      originalFileName: storedAudio.originalFileName,
      mimeType: storedAudio.mimeType,
      fileSize: storedAudio.fileSize,
      audioUrl: storedAudio.url || "/pending-stream-url",
      storageProvider: storedAudio.storageProvider || "local",
      storageResourceType: storedAudio.resourceType || "auto",
      storagePath: storedAudio.storagePath,
      createdAt: new Date(),
    });

    if (!storedAudio.url) {
      created.audioUrl = `/tracks/${created._id.toString()}/stream`;
    }
    await created.save();

    return res.status(201).json(trackDto(created));
  } catch (err) {
    await removeStoredFile(req.file && req.file.path);
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to create track.");
  }
});

router.get("/tracks/:trackId/comments", async (req, res) => {
  try {
    const trackId = String(req.params.trackId);
    const track = await Track.findById(trackId).lean().catch(() => null);

    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }
    if (track.kind !== "demo") {
      return jsonError(res, 400, "VALIDATION_ERROR", "Feedback is only available for demo tracks.");
    }

    const items = await Comment.find({ trackId }).sort({ createdAt: -1 }).lean();
    const userMeta = await getUserMetaById(items.map((comment) => comment.userId));
    return res.json(items.map((comment) => {
      const dto = commentDto(comment);
      const meta = userMeta.get(dto.userId) || {};
      return {
        ...dto,
        author: meta.username || dto.author,
        authorAvatarUrl: meta.avatarUrl || dto.authorAvatarUrl || "",
      };
    }));
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load comments.");
  }
});

router.get("/tracks/:trackId/ratings", async (req, res) => {
  try {
    const trackId = String(req.params.trackId);
    const track = await Track.findById(trackId).lean().catch(() => null);

    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }
    if (track.kind !== "demo") {
      return jsonError(res, 400, "VALIDATION_ERROR", "Ratings are only available for demo tracks.");
    }

    const items = await Rating.find({ trackId }).sort({ updatedAt: -1 }).lean();
    const userMeta = await getUserMetaById(items.map((rating) => rating.userId));
    return res.json({
      average: Number(track.ratingAverage || 0),
      count: Number(track.ratingCount || 0),
      items: items.map((rating) => {
        const userId = String(rating.userId || "");
        const meta = userMeta.get(userId) || {};
        return {
          id: rating._id.toString(),
          trackId: String(rating.trackId),
          userId,
          author: meta.username || rating.author,
          authorAvatarUrl: meta.avatarUrl || "",
          score: rating.score,
          text: rating.text,
          updatedAt: rating.updatedAt,
        };
      }),
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load ratings.");
  }
});

router.post("/tracks/:trackId/comments", requireAuth, async (req, res) => {
  try {
    if (await rejectBannedUser(req, res)) return;

    const trackId = String(req.params.trackId);
    const text = req.body && req.body.text ? String(req.body.text) : "";
    const category = sanitizeOptionalText(req.body ? req.body.category : "", 32).toLowerCase() || "general";
    const parentId = req.body && req.body.parentId ? String(req.body.parentId) : "";
    const parentRatingId = req.body && req.body.parentRatingId ? String(req.body.parentRatingId) : "";

    const track = await Track.findById(trackId).lean().catch(() => null);
    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }
    if (track.kind !== "demo") {
      return jsonError(res, 400, "VALIDATION_ERROR", "Feedback is only available for demo tracks.");
    }

    if (!isNonEmptyString(text)) {
      return jsonError(res, 400, "VALIDATION_ERROR", "text must not be empty.");
    }
    if (text.length > 500) {
      return jsonError(res, 400, "VALIDATION_ERROR", "text is too long (max 500).");
    }
    if (parentId && parentRatingId) {
      return jsonError(res, 400, "VALIDATION_ERROR", "Reply can target either feedback or comment, not both.");
    }
    let parentCommentId = null;
    let parentRatingObjectId = null;
    if (parentId) {
      const parent = await Comment.findById(parentId).lean().catch(() => null);
      if (!parent || String(parent.trackId) !== trackId) {
        return jsonError(res, 400, "VALIDATION_ERROR", "Reply target is not valid for this demo.");
      }
      parentCommentId = parent._id;
    }
    if (parentRatingId) {
      const parentRating = await Rating.findById(parentRatingId).lean().catch(() => null);
      if (!parentRating || String(parentRating.trackId) !== trackId) {
        return jsonError(res, 400, "VALIDATION_ERROR", "Reply target is not valid for this demo.");
      }
      parentRatingObjectId = parentRating._id;
    }
    const timestampSec = parseTimestampSec(req.body ? req.body.timestampSec : null, track.durationSec);

    const created = await Comment.create({
      trackId,
      parentId: parentCommentId,
      parentRatingId: parentRatingObjectId,
      userId: req.user.id,
      author: req.user.username,
      category: ["arrangement", "mix", "sound-design", "performance", "general"].includes(category) ? category : "general",
      timestampSec,
      text: text.trim(),
      createdAt: new Date(),
    });

    return res.status(201).json(commentDto(created));
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to create comment.");
  }
});

router.delete("/tracks/:trackId/comments/:commentId", requireAuth, async (req, res) => {
  try {
    if (await rejectBannedUser(req, res)) return;

    const trackId = String(req.params.trackId);
    const commentId = String(req.params.commentId);
    const comment = await Comment.findById(commentId);
    if (!comment || String(comment.trackId) !== trackId) {
      return jsonError(res, 404, "COMMENT_NOT_FOUND", "Comment not found.");
    }
    if (String(comment.userId || "") !== req.user.id) {
      return jsonError(res, 403, "FORBIDDEN", "You can only delete your own comments.");
    }

    comment.isDeleted = true;
    comment.text = "This comment was deleted.";
    comment.deletedAt = new Date();
    await comment.save();

    return res.json({ ok: true, comment: commentDto(comment) });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to delete comment.");
  }
});

router.post("/tracks/:trackId/comments/:commentId/reports", requireAuth, async (req, res) => {
  try {
    if (await rejectBannedUser(req, res)) return;

    const trackId = String(req.params.trackId);
    const commentId = String(req.params.commentId);
    const reasonRaw = String((req.body && req.body.reason) || "other").trim().toLowerCase();
    const details = sanitizeOptionalText(req.body ? req.body.details : "", 500);
    const reason = ["spam", "harassment", "copyright", "explicit", "misleading", "other"].includes(reasonRaw)
      ? reasonRaw
      : "other";

    const [track, comment] = await Promise.all([
      Track.findById(trackId).lean().catch(() => null),
      Comment.findById(commentId).lean().catch(() => null),
    ]);
    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }
    if (!comment || String(comment.trackId) !== trackId) {
      return jsonError(res, 404, "COMMENT_NOT_FOUND", "Comment not found.");
    }
    if (String(comment.userId || "") === req.user.id) {
      return jsonError(res, 400, "VALIDATION_ERROR", "You cannot report your own comment.");
    }

    const report = await Report.findOneAndUpdate(
      { targetType: "comment", trackId: track._id, commentId: comment._id, reporterId: req.user.id },
      {
        targetType: "comment",
        trackId: track._id,
        trackTitle: track.title,
        trackKind: track.kind,
        trackOwnerId: track.userId,
        trackOwnerUsername: track.username,
        commentId: comment._id,
        commentText: comment.isDeleted ? "This comment was deleted." : comment.text,
        commentAuthorId: String(comment.userId || ""),
        commentAuthorUsername: comment.author || "anonymous",
        reporterId: req.user.id,
        reporterUsername: req.user.username,
        reason,
        details,
        status: "open",
        createdAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ ok: true, reportId: report._id.toString() });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to report comment.");
  }
});

router.post("/tracks/:trackId/ratings", requireAuth, async (req, res) => {
  try {
    if (await rejectBannedUser(req, res)) return;

    const trackId = String(req.params.trackId);
    const text = sanitizeOptionalText(req.body ? req.body.text : "", 280);
    const scoreCheck = validateRatingScore(req.body ? req.body.score : null);

    const track = await Track.findById(trackId).lean().catch(() => null);
    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }
    if (track.kind !== "demo") {
      return jsonError(res, 400, "VALIDATION_ERROR", "Ratings are only available for demo tracks.");
    }
    if (!scoreCheck.ok) {
      return jsonError(res, 400, "VALIDATION_ERROR", scoreCheck.message);
    }

    await Rating.findOneAndUpdate(
      { trackId, userId: req.user.id },
      {
        trackId,
        userId: req.user.id,
        author: req.user.username,
        score: scoreCheck.value,
        text,
        updatedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    const aggregate = await Rating.aggregate([
      { $match: { trackId: new mongoose.Types.ObjectId(trackId) } },
      {
        $group: {
          _id: "$trackId",
          average: { $avg: "$score" },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = aggregate[0] || { average: 0, count: 0 };

    await Track.findByIdAndUpdate(trackId, {
      ratingAverage: Number(summary.average || 0).toFixed ? Number(Number(summary.average || 0).toFixed(1)) : 0,
      ratingCount: Number(summary.count || 0),
    });

    return res.status(201).json({
      ok: true,
      average: Number(Number(summary.average || 0).toFixed(1)),
      count: Number(summary.count || 0),
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to save rating.");
  }
});

router.get("/profile/:userId", async (req, res) => {
  try {
    const items = await Track.find({ userId: String(req.params.userId) })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(items.map(trackDto));
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load profile.");
  }
});

module.exports = router;
