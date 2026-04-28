"use strict";

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const collabRoutes = require("./routes/collabRoutes");
const trackRoutes = require("./routes/trackRoutes");
const userRoutes = require("./routes/userRoutes");
const { ensureUploadDir } = require("./utils/audioStorage");
const { jsonError } = require("./utils/http");

function createApp() {
  ensureUploadDir();

  const app = express();
  const allowedOrigins = String(process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cors({
    origin(origin, callback) {
      if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS."));
    },
  }));
  app.use(express.json({ limit: "25mb" }));

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/auth", authRoutes);
  app.use("/admin", adminRoutes);
  app.use(collabRoutes);
  app.use(userRoutes);
  app.use(trackRoutes);

  app.use((req, res) => {
    jsonError(res, 404, "NOT_FOUND", "Route not found.");
  });

  return app;
}

module.exports = { createApp };
