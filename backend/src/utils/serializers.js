"use strict";

const { generateAura } = require("./analysis");

function serializeAura(track) {
  if (track.aura && track.aura.gradient) {
    return track.aura;
  }

  return generateAura({
    title: track.title,
    originalFileName: track.originalFileName,
    genre: track.genre,
    bpm: track.bpm,
    musicalKey: track.musicalKey,
    energyLevel: track.energyLevel,
  });
}

function trackDto(track) {
  if (!track) {
    return track;
  }

  const id = track._id?.toString ? track._id.toString() : String(track._id || track.id);
  const isCloudMedia = track.storageProvider === "cloudinary" && track.audioUrl;
  const audioUrl = isCloudMedia ? track.audioUrl : `/tracks/${id}/stream`;

  return {
    id,
    userId: track.userId,
    username: track.username,
    userAvatarUrl: track.userAvatarUrl || "",
    title: track.title,
    kind: track.kind || "sample",
    genre: track.genre,
    description: track.description || "",
    bpm: track.bpm || null,
    musicalKey: track.musicalKey || "",
    energyLevel: track.energyLevel || "medium",
    tags: Array.isArray(track.tags) ? track.tags : [],
    aura: serializeAura(track),
    analysisSource: track.analysisSource || "manual",
    licenseLabel: track.licenseLabel || "Royalty-free",
    durationSec: track.durationSec || null,
    originalFileName: track.originalFileName || null,
    mimeType: track.mimeType || null,
    fileSize: track.fileSize || null,
    audioUrl,
    downloadUrl: track.kind === "sample" ? (isCloudMedia ? track.audioUrl : `/tracks/${id}/download`) : null,
    isDownloadable: track.kind === "sample",
    ratingAverage: Number(track.ratingAverage || 0),
    ratingCount: Number(track.ratingCount || 0),
    playCount: Number(track.playCount || 0),
    upvoteCount: Number(track.upvoteCount || 0),
    downvoteCount: Number(track.downvoteCount || 0),
    createdAt: track.createdAt,
  };
}

function commentDto(comment) {
  return {
    id: comment._id?.toString ? comment._id.toString() : String(comment.id),
    trackId: comment.trackId?.toString ? comment.trackId.toString() : String(comment.trackId),
    parentId: comment.parentId ? (comment.parentId.toString ? comment.parentId.toString() : String(comment.parentId)) : null,
    parentRatingId: comment.parentRatingId ? (comment.parentRatingId.toString ? comment.parentRatingId.toString() : String(comment.parentRatingId)) : null,
    userId: comment.userId ? (comment.userId.toString ? comment.userId.toString() : String(comment.userId)) : "",
    author: comment.author,
    authorAvatarUrl: comment.authorAvatarUrl || "",
    category: comment.category || "general",
    timestampSec: Number.isFinite(Number(comment.timestampSec)) ? Number(comment.timestampSec) : null,
    text: comment.isDeleted ? "This comment was deleted." : comment.text,
    isDeleted: Boolean(comment.isDeleted),
    createdAt: comment.createdAt,
  };
}

module.exports = {
  trackDto,
  commentDto,
};
