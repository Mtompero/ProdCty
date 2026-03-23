"use strict";

function jsonError(res, status, code, message, details) {
  const payload = { ok: false, error: { code, message } };
  if (details) {
    payload.error.details = details;
  }
  return res.status(status).json(payload);
}

module.exports = { jsonError };
