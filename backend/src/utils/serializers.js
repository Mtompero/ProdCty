"use strict";

function trackDto(track) {
  if (!track) {
    return track;
  }

  const id = track._id?.toString ? track._id.toString() : String(track._id || track.id);

  return {
    id,
    userId: track.userId,
    username: track.username,
    title: track.title,
    kind: track.kind || "sample",
    genre: track.genre,
    description: track.description || "",
    bpm: track.bpm || null,
    musicalKey: track.musicalKey || "",
    energyLevel: track.energyLevel || "medium",
    tags: Array.isArray(track.tags) ? track.tags : [],
    analysisSource: track.analysisSource || "manual",
    licenseLabel: track.licenseLabel || "Royalty-free",
    durationSec: track.durationSec || null,
    originalFileName: track.originalFileName || null,
    mimeType: track.mimeType || null,
    fileSize: track.fileSize || null,
    audioUrl: `/tracks/${id}/stream`,
    downloadUrl: track.kind === "sample" ? `/tracks/${id}/download` : null,
    isDownloadable: track.kind === "sample",
    ratingAverage: Number(track.ratingAverage || 0),
    ratingCount: Number(track.ratingCount || 0),
    playCount: Number(track.playCount || 0),
    createdAt: track.createdAt,
  };
}

function commentDto(comment) {
  return {
    id: comment._id?.toString ? comment._id.toString() : String(comment.id),
    trackId: comment.trackId?.toString ? comment.trackId.toString() : String(comment.trackId),
    author: comment.author,
    category: comment.category || "general",
    timestampSec: Number.isFinite(Number(comment.timestampSec)) ? Number(comment.timestampSec) : null,
    text: comment.text,
    createdAt: comment.createdAt,
  };
}

module.exports = {
  trackDto,
  commentDto,
};
