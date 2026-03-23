"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "..", "uploads");

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

function sanitizeFileName(fileName) {
  const base = path.basename(String(fileName || "file"));
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildStoredFileName(file) {
  const safeOriginalName = sanitizeFileName(file.originalname);
  const ext = path.extname(safeOriginalName) || ".bin";
  return `${Date.now()}-${crypto.randomUUID()}${ext}`;
}

function createDiskUploadMiddleware({ maxFileSize, fileFilter }) {
  ensureUploadDir();

  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, uploadDir);
    },
    filename(req, file, cb) {
      cb(null, buildStoredFileName(file));
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: maxFileSize,
      files: 1,
    },
    fileFilter,
  });
}

function getStoredFileMeta(file) {
  if (!file) {
    throw new Error("File is required.");
  }

  return {
    originalFileName: sanitizeFileName(file.originalname),
    mimeType: String(file.mimetype || "").toLowerCase(),
    fileSize: file.size,
    storagePath: file.path,
    storedFileName: file.filename,
  };
}

function removeStoredFile(storagePath) {
  if (!storagePath) return;
  if (fs.existsSync(storagePath)) {
    fs.unlinkSync(storagePath);
  }
}

function createImageUploadMiddleware() {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  return createDiskUploadMiddleware({
    maxFileSize: 5 * 1024 * 1024,
    fileFilter(req, file, cb) {
      if (!allowed.has(String(file.mimetype || "").toLowerCase())) {
        cb(new Error("Only JPEG, PNG or WEBP images are allowed."));
        return;
      }
      cb(null, true);
    },
  });
}

function getStoredImageMeta(file) {
  return getStoredFileMeta(file);
}

module.exports = {
  createDiskUploadMiddleware,
  createImageUploadMiddleware,
  ensureUploadDir,
  getStoredFileMeta,
  getStoredImageMeta,
  removeStoredFile,
  sanitizeFileName,
  uploadDir,
};
