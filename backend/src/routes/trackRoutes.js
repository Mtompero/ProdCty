"use strict";

const express = require("express");

const requireAuth = require("../../middleware/requireAuth");
const Comment = require("../models/Comment");
const Rating = require("../models/Rating");
const Track = require("../models/Track");
const {
  createAudioUploadMiddleware,
  getStoredAudioMeta,
  removeStoredFile,
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

function multerSingleAudio(req, res, next) {
  audioUpload.single("audio")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }
    return jsonError(res, 400, "VALIDATION_ERROR", err.message || "Audio upload failed.");
  });
}

router.get("/feed", async (req, res) => {
  try {
    const items = await Track.find({ kind: "sample" }).sort({ createdAt: -1 }).limit(24).lean();
    return res.json(items.map(trackDto));
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load feed.");
  }
});

router.get("/feed/for-you", async (req, res) => {
  try {
    const interests = normalizeTags(req.query.interests || "");
    const query = { kind: "sample" };
    const items = await Track.find(query).sort({ createdAt: -1 }).limit(60).lean();

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
      .slice(0, 18)
      .map((item) => trackDto(item.track));

    return res.json(scored);
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
    const query = {};

    if (userId) {
      query.userId = userId;
    }
    if (kind) {
      query.kind = kind;
    }
    if (genre) {
      query.genre = genre;
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
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { username: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $in: [q] } },
      ];
    }

    const items = await Track.find(query).sort({ createdAt: -1 }).lean();
    return res.json(items.map(trackDto));
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load tracks.");
  }
});

router.get("/demos", async (req, res) => {
  try {
    const items = await Track.find({ kind: "demo" }).sort({ createdAt: -1 }).lean();
    return res.json(items.map(trackDto));
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
    await Track.findByIdAndUpdate(track._id, { $inc: { playCount: 1 } }).catch(() => null);
    return res.json(trackDto(track));
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load track.");
  }
});

router.get("/tracks/:id/stream", async (req, res) => {
  try {
    const track = await Track.findById(String(req.params.id)).lean().catch(() => null);
    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }

    res.type(track.mimeType || "audio/mpeg");
    return res.sendFile(track.storagePath);
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

    return res.download(track.storagePath, track.originalFileName);
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to download track.");
  }
});

router.post("/tracks", requireAuth, multerSingleAudio, async (req, res) => {
  try {
    const title = req.body && req.body.title ? String(req.body.title) : "";
    const genre = normalizeGenre(req.body ? req.body.genre : "");
    const kind = normalizeTrackKind(req.body ? req.body.kind : "");
    const description = sanitizeOptionalText(req.body ? req.body.description : "", 500);
    const musicalKey = sanitizeOptionalText(req.body ? req.body.musicalKey : "", 16);
    const bpm = parseOptionalNumber(req.body ? req.body.bpm : null, 1, 400);
    const durationSec = parseDurationSec(req.body ? req.body.durationSec : null);
    const audioCheck = validateUploadedAudioFile(req.file);

    if (!isNonEmptyString(title)) {
      removeStoredFile(req.file && req.file.path);
      return jsonError(res, 400, "VALIDATION_ERROR", "title is required.");
    }
    if (!audioCheck.ok) {
      removeStoredFile(req.file && req.file.path);
      return jsonError(res, 400, "VALIDATION_ERROR", audioCheck.message);
    }

    const storedAudio = getStoredAudioMeta(req.file);
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

    const created = await Track.create({
      userId: req.user.id,
      username: req.user.username,
      title: title.trim(),
      kind,
      genre,
      tags: normalizeTags(req.body ? req.body.tags : "").length ? normalizeTags(req.body.tags) : analysis.tags,
      description,
      bpm: bpm || analysis.bpm,
      musicalKey: musicalKey || analysis.musicalKey,
      energyLevel: analysis.energyLevel,
      analysisSource: analysis.analysisSource,
      licenseLabel: "Royalty-free",
      durationSec,
      originalFileName: storedAudio.originalFileName,
      mimeType: storedAudio.mimeType,
      fileSize: storedAudio.fileSize,
      audioUrl: "/pending-stream-url",
      storagePath: storedAudio.storagePath,
      createdAt: new Date(),
    });

    created.audioUrl = `/tracks/${created._id.toString()}/stream`;
    await created.save();

    return res.status(201).json(trackDto(created));
  } catch (err) {
    removeStoredFile(req.file && req.file.path);
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

    const items = await Comment.find({ trackId }).sort({ createdAt: -1 }).lean();
    return res.json(items.map(commentDto));
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

    const items = await Rating.find({ trackId }).sort({ updatedAt: -1 }).lean();
    return res.json({
      average: Number(track.ratingAverage || 0),
      count: Number(track.ratingCount || 0),
      items: items.map((rating) => ({
        id: rating._id.toString(),
        trackId: String(rating.trackId),
        author: rating.author,
        score: rating.score,
        text: rating.text,
        updatedAt: rating.updatedAt,
      })),
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load ratings.");
  }
});

router.post("/tracks/:trackId/comments", requireAuth, async (req, res) => {
  try {
    const trackId = String(req.params.trackId);
    const text = req.body && req.body.text ? String(req.body.text) : "";
    const category = sanitizeOptionalText(req.body ? req.body.category : "", 32).toLowerCase() || "general";

    const track = await Track.findById(trackId).lean().catch(() => null);
    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }

    if (!isNonEmptyString(text)) {
      return jsonError(res, 400, "VALIDATION_ERROR", "text must not be empty.");
    }
    if (text.length > 500) {
      return jsonError(res, 400, "VALIDATION_ERROR", "text is too long (max 500).");
    }
    const timestampSec = parseTimestampSec(req.body ? req.body.timestampSec : null, track.durationSec);

    const created = await Comment.create({
      trackId,
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

router.post("/tracks/:trackId/ratings", requireAuth, async (req, res) => {
  try {
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
      { $match: { trackId: track._id } },
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
