"use strict";

const express = require("express");

const requireAuth = require("../../middleware/requireAuth");
const Track = require("../models/Track");
const User = require("../models/User");
const {
  createImageUploadMiddleware,
  getStoredImageMeta,
  removeStoredFile,
} = require("../utils/mediaStorage");
const { jsonError } = require("../utils/http");
const {
  isNonEmptyString,
  normalizeInterests,
  sanitizeOptionalText,
  validateUploadedImageFile,
} = require("../utils/validators");
const { trackDto } = require("../utils/serializers");

const router = express.Router();
const imageUpload = createImageUploadMiddleware();

function multerSingleAvatar(req, res, next) {
  imageUpload.single("avatar")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }
    return jsonError(res, 400, "VALIDATION_ERROR", err.message || "Avatar upload failed.");
  });
}

function userDto(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    interests: user.interests || [],
    bio: user.bio || "",
    avatarUrl: user.avatarUrl || null,
    createdAt: user.createdAt,
  };
}

function buildProfileStats(tracks) {
  const samples = tracks.filter((track) => track.kind === "sample");
  const demos = tracks.filter((track) => track.kind === "demo");
  const totalPlays = tracks.reduce((sum, track) => sum + Number(track.playCount || 0), 0);
  const totalRatings = demos.reduce((sum, track) => sum + Number(track.ratingCount || 0), 0);

  return {
    totalUploads: tracks.length,
    sampleCount: samples.length,
    demoCount: demos.length,
    totalPlays,
    totalRatings,
  };
}

router.get("/users/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (!query) {
      return res.json([]);
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const users = await User.find({
      username: { $regex: escaped, $options: "i" },
    })
      .sort({ username: 1 })
      .limit(12)
      .lean();

    return res.json(users.map(userDto));
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to search users.");
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(String(req.params.id)).lean().catch(() => null);
    if (!user) {
      return jsonError(res, 404, "USER_NOT_FOUND", "User not found.");
    }

    const tracks = await Track.find({ userId: String(req.params.id) })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      user: userDto(user),
      samples: tracks.filter((track) => track.kind === "sample").map(trackDto),
      demos: tracks.filter((track) => track.kind === "demo").map(trackDto),
      stats: buildProfileStats(tracks),
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load profile.");
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean().catch(() => null);
    if (!user) {
      return jsonError(res, 404, "USER_NOT_FOUND", "User not found.");
    }

    return res.json({ user: userDto(user) });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load current user.");
  }
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const bio = sanitizeOptionalText(req.body ? req.body.bio : "", 240);
    const interests = req.body && req.body.interests !== undefined
      ? normalizeInterests(req.body.interests)
      : undefined;

    const user = await User.findById(req.user.id);
    if (!user) {
      return jsonError(res, 404, "USER_NOT_FOUND", "User not found.");
    }

    user.bio = bio;
    if (interests) {
      user.interests = interests.slice(0, 20);
    }
    await user.save();

    return res.json({
      ok: true,
      user: userDto(user),
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to update profile.");
  }
});

router.post("/me/avatar", requireAuth, multerSingleAvatar, async (req, res) => {
  try {
    const imageCheck = validateUploadedImageFile(req.file);
    if (!imageCheck.ok) {
      removeStoredFile(req.file && req.file.path);
      return jsonError(res, 400, "VALIDATION_ERROR", imageCheck.message);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      removeStoredFile(req.file && req.file.path);
      return jsonError(res, 404, "USER_NOT_FOUND", "User not found.");
    }

    const storedImage = getStoredImageMeta(req.file);
    if (user.avatarStoragePath) {
      removeStoredFile(user.avatarStoragePath);
    }

    user.avatarUrl = `/users/${user._id.toString()}/avatar`;
    user.avatarStoragePath = storedImage.storagePath;
    await user.save();

    return res.json({
      ok: true,
      user: userDto(user),
    });
  } catch (err) {
    removeStoredFile(req.file && req.file.path);
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to upload avatar.");
  }
});

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(String(req.params.id)).lean().catch(() => null);
    if (!user || !isNonEmptyString(user.avatarStoragePath)) {
      return jsonError(res, 404, "AVATAR_NOT_FOUND", "Avatar not found.");
    }

    return res.sendFile(user.avatarStoragePath);
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load avatar.");
  }
});

module.exports = router;
