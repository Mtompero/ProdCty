"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const requireAuth = require("../middleware/requireAuth");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const { connectDb } = require("./db");      
const Track = require("./models/Track");    
const Comment = require("./models/Comment");
const app = express();

app.use(cors());
app.use(express.json());

function jsonError(res, status, code, message, details) {
  const payload = { ok: false, error: { code, message } };
  if (details) payload.error.details = details;
  return res.status(status).json(payload);
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function trackDto(t) {
  if (!t) return t;

  const _id = t._id?.toString ? t._id.toString() : String(t._id || t.id);

  return {
    id: _id,
    userId: t.userId,
    username: t.username,
    title: t.title,
    genre: t.genre,
    createdAt: t.createdAt,
  };
}


app.get("/health", (req, res) => {
  res.json({ ok: true });
});

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizeInterests(v) {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : String(v).split(",");
  const cleaned = arr
    .map((x) => String(x).trim().toLowerCase())
    .filter((x) => x.length > 0);
  return [...new Set(cleaned)].slice(0, 20);
}

app.post("/auth/register", async (req, res) => {
  try {
    const username = req.body && req.body.username ? String(req.body.username) : "";
    const email = req.body && req.body.email ? String(req.body.email) : "";
    const password = req.body && req.body.password ? String(req.body.password) : "";
    const interests = normalizeInterests(req.body ? req.body.interests : []);

    if (!isNonEmptyString(username) || username.trim().length < 3) {
      return jsonError(res, 400, "VALIDATION_ERROR", "username must be at least 3 characters.");
    }
    if (!isValidEmail(email)) {
      return jsonError(res, 400, "VALIDATION_ERROR", "email is invalid.");
    }
    if (!isNonEmptyString(password) || password.length < 6) {
      return jsonError(res, 400, "VALIDATION_ERROR", "password must be at least 6 characters.");
    }

    const emailNorm = email.trim().toLowerCase();

    const emailExists = await User.findOne({ email: emailNorm }).lean();
      if (emailExists) {
        return jsonError(res, 409, "EMAIL_TAKEN", "This email is already registered.");
}

    const usernameExists = await User.findOne({ username: username.trim() }).lean();
      if (usernameExists) {
        return jsonError(res, 409, "USERNAME_TAKEN", "This username is already taken.");
    }


    const passwordHash = await bcrypt.hash(password, 10);

    const created = await User.create({
      username: username.trim(),
      email: emailNorm,
      passwordHash,
      interests,
      createdAt: new Date(),
    });

    return res.status(201).json({
      ok: true,
      user: {
        id: created._id.toString(),
        username: created.username,
        email: created.email,
        interests: created.interests,
        createdAt: created.createdAt,
      },
    });
  } catch (err) {
    const isDup = err && (err.code === 11000 || String(err.message || "").includes("E11000"));
    if (isDup) {
      return jsonError(res, 409, "EMAIL_TAKEN", "This email is already registered.");
    }
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to register user.");
  }
});
app.post("/auth/login", async (req, res) => {
  try {
    const email = req.body && req.body.email ? String(req.body.email) : "";
    const password = req.body && req.body.password ? String(req.body.password) : "";

    if (!isValidEmail(email)) {
      return jsonError(res, 400, "VALIDATION_ERROR", "email is invalid.");
    }
    if (!isNonEmptyString(password)) {
      return jsonError(res, 400, "VALIDATION_ERROR", "password is required.");
    }

    const emailNorm = email.trim().toLowerCase();

    const user = await User.findOne({ email: emailNorm }).lean();
    if (!user) {
      return jsonError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return jsonError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret || String(secret).trim().length < 12) {
      return jsonError(res, 500, "SERVER_MISCONFIG", "JWT secret is missing or too short.");
    }

    const token = jwt.sign(
      { sub: user._id.toString(), username: user.username, email: user.email },
      secret,
      { expiresIn: "7d" }
    );

    return res.json({
      ok: true,
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        interests: user.interests || [],
      },
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to login.");
  }
});


app.get("/feed", async (req, res) => {
  try {
    const items = await Track.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.json(items.map(trackDto));
  } catch {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load feed.");
  }
});


app.get("/tracks", async (req, res) => {
  try {
    const userId = req.query.userId ? String(req.query.userId) : null;

    const q = userId ? { userId } : {};
    const items = await Track.find(q)
      .sort({ createdAt: -1 })
      .lean();

    return res.json(items.map(trackDto));
  } catch {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load tracks.");
  }
});


app.get("/tracks/:id", async (req, res) => {
  try {
    const id = String(req.params.id);

    const track = await Track.findById(id).lean().catch(() => null);
    if (!track) return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");

    return res.json(trackDto(track));
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load track.");
  }
});

app.post("/tracks", requireAuth, async (req, res) => {
  try {
    const title = req.body && req.body.title ? String(req.body.title) : "";
    const genre = req.body && req.body.genre ? String(req.body.genre) : "unknown";

    if (!isNonEmptyString(title)) {
      return jsonError(res, 400, "VALIDATION_ERROR", "title is required.");
    }

    const created = await Track.create({
      userId: req.user.id,
      username: req.user.username,
      title: title.trim(),
      genre: genre.trim() || "unknown",
      createdAt: new Date(),
    });

    return res.status(201).json({
      id: created._id.toString(),
      userId: created.userId,
      username: created.username,
      title: created.title,
      genre: created.genre,
      createdAt: created.createdAt,
    });
  } catch {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to create track.");
  }
});

app.get("/tracks/:trackId/comments", async (req, res) => {
  try {
    const trackId = String(req.params.trackId);

    const track = await Track.findById(trackId).lean().catch(() => null);
    if (!track) return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");

    const items = await Comment.find({ trackId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(
      items.map((c) => ({
        id: c._id.toString(),
        trackId: String(c.trackId),
        author: c.author,
        text: c.text,
        createdAt: c.createdAt,
      }))
    );
  } catch {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load comments.");
  }
});

app.post("/tracks/:trackId/comments", requireAuth, async (req, res) => {
  try {
    const trackId = String(req.params.trackId);
    const text = req.body && req.body.text ? String(req.body.text) : "";

    const track = await Track.findById(trackId).lean().catch(() => null);
    if (!track) return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");

    if (!isNonEmptyString(text)) {
      return jsonError(res, 400, "VALIDATION_ERROR", "text must not be empty.");
    }
    if (text.length > 500) {
      return jsonError(res, 400, "VALIDATION_ERROR", "text is too long (max 500).");
    }

    const created = await Comment.create({
      trackId,
      userId: req.user.id,
      author: req.user.username,
      text: text.trim(),
      createdAt: new Date(),
    });

    return res.status(201).json({
      id: created._id.toString(),
      trackId: String(created.trackId),
      author: created.author,
      text: created.text,
      createdAt: created.createdAt,
    });
  } catch {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to create comment.");
  }
});


app.post("/tracks/:trackId/comments", async (req, res) => {
  try {
    const trackId = String(req.params.trackId);
    const author = req.body && req.body.author ? String(req.body.author) : "anonymous";
    const text = req.body && req.body.text ? String(req.body.text) : "";

    const track = await Track.findById(trackId).lean().catch(() => null);
    if (!track) return jsonError(res, 404, "TRACK_NOT_FOUND", "Track not found.");

    if (!isNonEmptyString(text)) {
      return jsonError(res, 400, "VALIDATION_ERROR", "text must not be empty.");
    }
    if (text.length > 500) {
      return jsonError(res, 400, "VALIDATION_ERROR", "text is too long (max 500).");
    }

    const created = await Comment.create({
      trackId,
      author: author.trim() || "anonymous",
      text: text.trim(),
      createdAt: new Date(),
    });

    return res.status(201).json({
      id: created._id.toString(),
      trackId: created.trackId.toString(),
      author: created.author,
      text: created.text,
      createdAt: created.createdAt,
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to create comment.");
  }
});


app.get("/profile/:userId", async (req, res) => {
  try {
    const userId = String(req.params.userId);

    const mine = await Track.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.json(mine);
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to load profile.");
  }
});

app.use((req, res) => {
  jsonError(res, 404, "NOT_FOUND", "Route not found.");
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function start() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`ProdCty running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("DB connect error:", err && err.message ? err.message : err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.expo
