"use strict";

const {
  createDiskUploadMiddleware,
  ensureUploadDir,
  getStoredFileMeta,
  removeStoredFile,
  uploadDir,
} = require("./mediaStorage");

const allowedMimeTypes = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/flac",
]);

function getExtensionFromMimeType(mimeType) {
  const map = {
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/wave": ".wav",
    "audio/ogg": ".ogg",
    "audio/webm": ".webm",
    "audio/mp4": ".m4a",
    "audio/x-m4a": ".m4a",
    "audio/aac": ".aac",
    "audio/flac": ".flac",
  };

  return map[mimeType] || "";
}

function isAllowedAudioMimeType(mimeType) {
  return allowedMimeTypes.has(String(mimeType || "").toLowerCase());
}

function createAudioUploadMiddleware() {
  return createDiskUploadMiddleware({
    maxFileSize: 25 * 1024 * 1024,
    fileFilter(req, file, cb) {
      if (!isAllowedAudioMimeType(file.mimetype)) {
        cb(new Error("Only supported audio files can be uploaded."));
        return;
      }
      cb(null, true);
    },
  });
}

function getStoredAudioMeta(file) {
  return getStoredFileMeta(file);
}

module.exports = {
  ensureUploadDir,
  createAudioUploadMiddleware,
  getExtensionFromMimeType,
  getStoredAudioMeta,
  isAllowedAudioMimeType,
  removeStoredFile,
  uploadDir,
};
