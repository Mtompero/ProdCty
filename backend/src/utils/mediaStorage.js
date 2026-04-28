"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

const uploadDir = path.join(__dirname, "..", "..", "uploads");
const CLOUDINARY_PROVIDER = "cloudinary";
const LOCAL_PROVIDER = "local";

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

function getStorageProvider() {
  const provider = String(process.env.MEDIA_STORAGE_PROVIDER || "").trim().toLowerCase();
  if (provider === CLOUDINARY_PROVIDER) return CLOUDINARY_PROVIDER;
  if (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
    return CLOUDINARY_PROVIDER;
  }
  return LOCAL_PROVIDER;
}

function isCloudinaryEnabled() {
  return getStorageProvider() === CLOUDINARY_PROVIDER;
}

function configureCloudinary() {
  if (!isCloudinaryEnabled()) return;
  if (process.env.CLOUDINARY_URL) return;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
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

function createMemoryUploadMiddleware({ maxFileSize, fileFilter }) {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxFileSize,
      files: 1,
    },
    fileFilter,
  });
}

function createUploadMiddleware(options) {
  if (isCloudinaryEnabled()) {
    return createMemoryUploadMiddleware(options);
  }
  return createDiskUploadMiddleware(options);
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
    storageProvider: LOCAL_PROVIDER,
  };
}

function uploadBufferToCloudinary(file, { folder, resourceType = "auto" }) {
  if (!file || !file.buffer) {
    return Promise.reject(new Error("File buffer is required for cloud upload."));
  }

  configureCloudinary();
  const safeOriginalName = sanitizeFileName(file.originalname);
  const publicId = `${Date.now()}-${crypto.randomUUID()}-${path.basename(safeOriginalName, path.extname(safeOriginalName))}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        use_filename: false,
        unique_filename: false,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloud upload failed."));
          return;
        }
        resolve({
          originalFileName: safeOriginalName,
          mimeType: String(file.mimetype || "").toLowerCase(),
          fileSize: file.size,
          storageProvider: CLOUDINARY_PROVIDER,
          storagePath: result.public_id,
          publicId: result.public_id,
          url: result.secure_url || result.url,
          resourceType: result.resource_type || resourceType,
        });
      }
    );

    stream.end(file.buffer);
  });
}

async function removeStoredFile(storagePath, storageProvider = LOCAL_PROVIDER, resourceType = "auto") {
  if (!storagePath) return;
  if (storageProvider === CLOUDINARY_PROVIDER) {
    configureCloudinary();
    await cloudinary.uploader.destroy(storagePath, {
      resource_type: resourceType,
      invalidate: true,
    }).catch(() => undefined);
    return;
  }
  if (fs.existsSync(storagePath)) {
    fs.unlinkSync(storagePath);
  }
}

function createImageUploadMiddleware() {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  return createUploadMiddleware({
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

async function storeUploadedImage(file) {
  if (isCloudinaryEnabled()) {
    return uploadBufferToCloudinary(file, {
      folder: process.env.CLOUDINARY_AVATAR_FOLDER || "prodcty/avatars",
      resourceType: "image",
    });
  }
  return getStoredImageMeta(file);
}

module.exports = {
  CLOUDINARY_PROVIDER,
  LOCAL_PROVIDER,
  createDiskUploadMiddleware,
  createImageUploadMiddleware,
  createUploadMiddleware,
  ensureUploadDir,
  getStorageProvider,
  getStoredFileMeta,
  getStoredImageMeta,
  isCloudinaryEnabled,
  removeStoredFile,
  sanitizeFileName,
  storeUploadedImage,
  uploadBufferToCloudinary,
  uploadDir,
};
