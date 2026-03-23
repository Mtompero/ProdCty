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

router.post("/register", async (req, res) => {
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
    const usernameNorm = username.trim();

    const emailExists = await User.findOne({ email: emailNorm }).lean();
    if (emailExists) {
      return jsonError(res, 409, "EMAIL_TAKEN", "This email is already registered.");
    }

    const usernameExists = await User.findOne({ username: usernameNorm }).lean();
    if (usernameExists) {
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

    return res.status(201).json({
      ok: true,
      user: userDto(created),
    });
  } catch (err) {
    const isDup = err && (err.code === 11000 || String(err.message || "").includes("E11000"));
    if (isDup) {
      return jsonError(res, 409, "EMAIL_TAKEN", "This email is already registered.");
    }
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to register user.");
  }
});

router.post("/login", async (req, res) => {
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
      user: userDto(user),
    });
  } catch (err) {
    return jsonError(res, 500, "INTERNAL_ERROR", "Failed to login.");
  }
});

module.exports = router;
