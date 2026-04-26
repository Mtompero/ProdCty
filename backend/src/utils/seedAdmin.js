"use strict";

const bcrypt = require("bcryptjs");

const User = require("../models/User");

async function ensureAdminUser() {
  const email = String(process.env.ADMIN_EMAIL || "admin@admin.com").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "Admin12345");

  if (!email || password.length < 8) {
    console.warn("[admin] ADMIN_EMAIL or ADMIN_PASSWORD is invalid, admin seed skipped.");
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
      console.log(`[admin] promoted existing user to admin: ${email}`);
    }
    return;
  }

  const preferredUsername = "admin";
  const usernameExists = await User.findOne({ username: preferredUsername }).lean();
  const username = usernameExists ? "prodcty_admin" : preferredUsername;
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    username,
    email,
    passwordHash,
    role: "admin",
    interests: ["rock", "lofi", "hip hop"],
    bio: "ProdCty demo administrator.",
    createdAt: new Date(),
  });

  console.log(`[admin] demo admin user created: ${email}`);
}

module.exports = { ensureAdminUser };
