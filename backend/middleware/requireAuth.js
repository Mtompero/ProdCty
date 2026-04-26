const jwt = require("jsonwebtoken");

module.exports = function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        ok: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing token",
        },
      });
    }

    const token = authHeader.slice(7).trim();
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        ok: false,
        error: {
          code: "SERVER_MISCONFIG",
          message: "JWT secret missing",
        },
      });
    }

    const payload = jwt.verify(token, secret);

    req.user = {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      avatarUrl: payload.avatarUrl || "",
      role: payload.role || "user",
      moderationStatus: payload.moderationStatus || "active",
    };

    next();
  } catch {
    return res.status(401).json({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid token",
      },
    });
  }
};
