"use strict";

const express = require("express");

const requireAuth = require("../../middleware/requireAuth");
const CollabRequest = require("../models/CollabRequest");
const Track = require("../models/Track");
const User = require("../models/User");
const { jsonError } = require("../utils/http");
const { normalizeTags, sanitizeOptionalText } = require("../utils/validators");

const router = express.Router();

const COLLAB_SKILLS = [
  "vocals",
  "mixing",
  "mastering",
  "guitar",
  "drums",
  "beat",
  "production",
  "songwriting",
  "other",
];
const CONTACT_PREFERENCES = ["email", "instagram"];

async function rejectBannedUser(req, res) {
  const user = await User.findById(req.user.id).select("moderationStatus moderationReason").lean().catch(() => null);
  if (user && user.moderationStatus === "banned") {
    jsonError(res, 403, "ACCOUNT_BANNED", user.moderationReason || "This account is banned.");
    return true;
  }
  return false;
}

function collabRequestDto(item, viewerId) {
  const isRequester = item.requesterId === viewerId;
  const isAccepted = item.status === "accepted";
  const contactPreference = CONTACT_PREFERENCES.includes(item.contactPreference) ? item.contactPreference : "email";
  const visibleInstagramHandle = isRequester || isAccepted ? item.instagramHandle || "" : "";
  const visibleRequesterEmail = contactPreference === "email" && (isRequester || isAccepted)
    ? item.requesterEmail || ""
    : "";
  return {
    id: item._id.toString(),
    trackId: item.trackId.toString(),
    trackTitle: item.trackTitle,
    trackOwnerId: item.trackOwnerId,
    trackOwnerUsername: item.trackOwnerUsername,
    requesterId: item.requesterId,
    requesterUsername: item.requesterUsername,
    requesterAvatarUrl: item.requesterAvatarUrl || "",
    message: item.message,
    skills: item.skills || [],
    contactPreference,
    requesterEmail: visibleRequesterEmail,
    emailVisible: Boolean(visibleRequesterEmail),
    instagramHandle: visibleInstagramHandle,
    instagramVisible: Boolean(visibleInstagramHandle),
    status: item.status,
    direction: item.trackOwnerId === viewerId ? "incoming" : "outgoing",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

router.post("/tracks/:trackId/collab-requests", requireAuth, async (req, res) => {
  try {
    if (await rejectBannedUser(req, res)) return;

    const track = await Track.findById(String(req.params.trackId)).lean().catch(() => null);
    if (!track) {
      return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");
    }
    if (track.kind !== "demo") {
      return jsonError(res, 400, "VALIDATION_ERROR", "Collab requests are only available for demos.");
    }
    if (track.userId === req.user.id) {
      return jsonError(res, 400, "VALIDATION_ERROR", "You cannot request collaboration on your own demo.");
    }

    const message = sanitizeOptionalText(req.body ? req.body.message : "", 500);
    if (!message) {
      return jsonError(res, 400, "VALIDATION_ERROR", "message must not be empty.");
    }

    const skills = normalizeTags(req.body ? req.body.skills : "")
      .filter((skill) => COLLAB_SKILLS.includes(skill))
      .slice(0, 5);
    const requestedContactPreference = String((req.body && req.body.contactPreference) || "email").toLowerCase();
    const contactPreference = CONTACT_PREFERENCES.includes(requestedContactPreference)
      ? requestedContactPreference
      : "email";
    const instagramHandle = sanitizeOptionalText(req.body ? req.body.instagramHandle : "", 64)
      .replace(/^@+/, "")
      .replace(/[^a-z0-9._]/gi, "")
      .slice(0, 30);

    if (contactPreference === "instagram" && !instagramHandle) {
      return jsonError(res, 400, "VALIDATION_ERROR", "Instagram handle is required when Instagram contact is selected.");
    }

    const existing = await CollabRequest.findOne({
      trackId: track._id,
      requesterId: req.user.id,
    }).lean();
    if (existing && existing.status === "pending") {
      return jsonError(res, 409, "COLLAB_REQUEST_EXISTS", "You already have a pending request for this demo.");
    }

    const request = await CollabRequest.findOneAndUpdate(
      { trackId: track._id, requesterId: req.user.id },
      {
        trackId: track._id,
        trackTitle: track.title,
        trackOwnerId: track.userId,
        trackOwnerUsername: track.username,
        requesterId: req.user.id,
        requesterUsername: req.user.username,
        requesterAvatarUrl: req.user.avatarUrl || "",
        requesterEmail: req.user.email || "",
        message,
        skills,
        contactPreference,
        instagramHandle,
        status: "pending",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.status(201).json({ ok: true, request: collabRequestDto(request, req.user.id) });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to send collab request.");
  }
});

router.get("/collab-requests", requireAuth, async (req, res) => {
  try {
    const items = await CollabRequest.find({
      $or: [
        { trackOwnerId: req.user.id },
        { requesterId: req.user.id },
      ],
    })
      .sort({ status: 1, updatedAt: -1, createdAt: -1 })
      .limit(80)
      .lean();

    return res.json({
      items: items.map((item) => collabRequestDto(item, req.user.id)),
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load collab requests.");
  }
});

router.patch("/collab-requests/:id", requireAuth, async (req, res) => {
  try {
    if (await rejectBannedUser(req, res)) return;

    const status = String((req.body && req.body.status) || "").trim().toLowerCase();
    if (!["accepted", "declined"].includes(status)) {
      return jsonError(res, 400, "VALIDATION_ERROR", "Collab request status is not valid.");
    }

    const request = await CollabRequest.findById(String(req.params.id));
    if (!request) {
      return jsonError(res, 404, "COLLAB_REQUEST_NOT_FOUND", "Collab request not found.");
    }
    if (request.trackOwnerId !== req.user.id) {
      return jsonError(res, 403, "FORBIDDEN", "Only the demo owner can update this collab request.");
    }

    request.status = status;
    await request.save();
    return res.json({ ok: true, request: collabRequestDto(request, req.user.id) });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to update collab request.");
  }
});

module.exports = router;
