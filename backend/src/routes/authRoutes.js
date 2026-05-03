"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { jsonError } = require("../utils/http");
const {
  isNonEmptyString,
  isValidEmail,
  normalizeInterests,
} = require("../utils/validators");

const router = express.Router();
const authAttempts = new Map();
const AUTH_WINDOW_MS = 10 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 8;

function userDto(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role || "user",
    moderationStatus: user.moderationStatus || "active",
    warningCount: Number(user.warningCount || 0),
    moderationReason: user.moderationReason || "",
    interests: user.interests || [],
    bio: user.bio || "",
    avatarUrl: user.avatarUrl || null,
    createdAt: user.createdAt,
  };
}

function getClientKey(req) {
  return String(req.ip || req.headers["x-forwarded-for"] || "unknown");
}

function isRateLimited(req) {
  const key = getClientKey(req);
  const now = Date.now();
  const entry = authAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    authAttempts.set(key, { count: 0, resetAt: now + AUTH_WINDOW_MS });
    return false;
  }
  return entry.count >= AUTH_MAX_ATTEMPTS;
}

function recordFailedAttempt(req) {
  const key = getClientKey(req);
  const now = Date.now();
  const entry = authAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    authAttempts.set(key, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return;
  }
  entry.count += 1;
  authAttempts.set(key, entry);
}

function clearFailedAttempts(req) {
  authAttempts.delete(getClientKey(req));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.post("/register", async (req, res) => {
  try {
    if (isRateLimited(req)) {
      return jsonError(res, 429, "RATE_LIMITED", "Too many auth attempts. Please wait and try again.");
    }

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
    if (!isNonEmptyString(password) || password.length < 8) {
      return jsonError(res, 400, "VALIDATION_ERROR", "password must be at least 8 characters.");
    }

    const emailNorm = email.trim().toLowerCase();
    const usernameNorm = username.trim();

    const emailExists = await User.findOne({ email: emailNorm }).lean();
    if (emailExists) {
      recordFailedAttempt(req);
      return jsonError(res, 409, "EMAIL_TAKEN", "This email is already registered.");
    }

    const usernameExists = await User.findOne({
      username: { $regex: `^${escapeRegExp(usernameNorm)}$`, $options: "i" },
    }).lean();
    if (usernameExists) {
      recordFailedAttempt(req);
      return jsonError(res, 409, "USERNAME_TAKEN", "This username is already taken.");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await User.create({
      username: usernameNorm,
      email: emailNorm,
      passwordHash,
      interests,
      createdAt: new Date(),
    });

    clearFailedAttempts(req);

    return res.status(201).json({
      ok: true,
      user: userDto(created),
    });
  } catch (err) {
    const isDup = err && (err.code === 11000 || String(err.message || "").includes("E11000"));
    if (isDup) {
      recordFailedAttempt(req);
      const dupField = err && err.keyPattern ? Object.keys(err.keyPattern)[0] : "";
      if (dupField === "username") {
        return jsonError(res, 409, "USERNAME_TAKEN", "This username is already taken.");
      }
      return jsonError(res, 409, "EMAIL_TAKEN", "This email is already registered.");
    }
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to register user.");
  }
});

router.post("/login", async (req, res) => {
  try {
    if (isRateLimited(req)) {
      return jsonError(res, 429, "RATE_LIMITED", "Too many auth attempts. Please wait and try again.");
    }

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
      recordFailedAttempt(req);
      return jsonError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      recordFailedAttempt(req);
      return jsonError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }
    if (user.moderationStatus === "banned") {
      return jsonError(
        res,
        403,
        "ACCOUNT_BANNED",
        `Your account is banned. Reason: ${user.moderationReason || "Repeated moderation violations."}`
      );
    }

    clearFailedAttempts(req);

    const secret = process.env.JWT_SECRET;
    if (!secret || String(secret).trim().length < 12) {
      return jsonError(res, 500, "SERVER_MISCONFIG", "JWT secret is missing or too short.");
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl || "",
        role: user.role || "user",
        moderationStatus: user.moderationStatus || "active",
      },
      secret,
      { expiresIn: "7d" }
    );

    return res.json({
      ok: true,
      token,
      user: userDto(user),
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to login.");
  }
});

module.exports = router;
