"use strict";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizeInterests(value) {
  if (!value) {
    return [];
  }

  const items = Array.isArray(value) ? value : String(value).split(",");
  const cleaned = items
    .map((item) => String(item).trim().toLowerCase())
    .filter((item) => item.length > 0);

  return [...new Set(cleaned)].slice(0, 20);
}

function normalizeGenre(value) {
  const genre = String(value || "").trim();
  return genre || "unknown";
}

function normalizeTrackKind(value) {
  return String(value || "").trim().toLowerCase() === "demo" ? "demo" : "sample";
}

function parseOptionalNumber(value, min, max) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  if (typeof min === "number" && parsed < min) {
    return null;
  }
  if (typeof max === "number" && parsed > max) {
    return null;
  }

  return Math.round(parsed);
}

function sanitizeOptionalText(value, maxLength) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }

  return text.slice(0, maxLength);
}

function parseDurationSec(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed);
}

function validateUploadedAudioFile(file) {
  if (!file) {
    return { ok: false, message: "audio file is required." };
  }
  if (!isNonEmptyString(file.originalname)) {
    return { ok: false, message: "audio file name is required." };
  }
  if (!String(file.mimetype || "").startsWith("audio/")) {
    return { ok: false, message: "audio mime type is invalid." };
  }

  return { ok: true };
}

function validateRatingScore(value) {
  const score = Number(value);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return { ok: false, message: "score must be an integer between 1 and 5." };
  }

  return { ok: true, value: score };
}

function validateUploadedImageFile(file) {
  if (!file) {
    return { ok: false, message: "avatar file is required." };
  }
  if (!isNonEmptyString(file.originalname)) {
    return { ok: false, message: "avatar file name is required." };
  }
  if (!String(file.mimetype || "").startsWith("image/")) {
    return { ok: false, message: "avatar mime type is invalid." };
  }

  return { ok: true };
}

module.exports = {
  isNonEmptyString,
  isValidEmail,
  normalizeInterests,
  normalizeGenre,
  normalizeTrackKind,
  parseOptionalNumber,
  sanitizeOptionalText,
  parseDurationSec,
  validateUploadedAudioFile,
  validateUploadedImageFile,
  validateRatingScore,
};
