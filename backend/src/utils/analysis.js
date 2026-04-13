"use strict";

const KEY_PATTERN = /\b([A-G](?:#|b)?m?)\b/i;
const BPM_PATTERN = /\b((?:[6-9]\d)|(?:1\d{2})|(?:2[0-2]\d))\s?bpm\b/i;
const NUMBER_PATTERN = /\b((?:[6-9]\d)|(?:1\d{2})|(?:2[0-2]\d))\b/;

function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9#]+/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

function detectBpm(sourceText, fallbackDurationSec) {
  const bpmMatch = String(sourceText || "").match(BPM_PATTERN) || String(sourceText || "").match(NUMBER_PATTERN);
  if (bpmMatch) {
    const parsed = Number(bpmMatch[1]);
    if (Number.isFinite(parsed) && parsed >= 60 && parsed <= 220) {
      return parsed;
    }
  }

  const duration = Number(fallbackDurationSec || 0);
  if (duration > 0 && duration < 20) return 128;
  if (duration >= 20 && duration < 60) return 110;
  if (duration >= 60 && duration < 180) return 96;
  return 124;
}

function detectMusicalKey(sourceText) {
  const match = String(sourceText || "").match(KEY_PATTERN);
  return match ? match[1] : "";
}

function detectEnergy(genre, bpm, sourceText) {
  const text = `${genre || ""} ${sourceText || ""}`.toLowerCase();

  if (/(ambient|drone|sleep|cinematic|soft|lofi|chill)/.test(text)) return "low";
  if (/(club|trap|drill|festival|hard|phonk|rage)/.test(text)) return "high";

  if (Number(bpm || 0) >= 135) return "high";
  if (Number(bpm || 0) >= 105) return "medium";
  return "low";
}

function collectTags({ title, genre, musicalKey, energyLevel, kind, username }) {
  const set = new Set([
    ...tokenize(title),
    ...tokenize(genre),
    ...tokenize(musicalKey),
    ...tokenize(energyLevel),
    ...tokenize(kind),
    ...tokenize(username),
  ]);

  return [...set].slice(0, 20);
}

function analyzeTrackMetadata({ title, originalFileName, genre, bpm, musicalKey, durationSec, kind, username }) {
  const sourceText = `${title || ""} ${originalFileName || ""} ${genre || ""}`.trim();
  const detectedBpm = bpm || detectBpm(sourceText, durationSec);
  const detectedKey = musicalKey || detectMusicalKey(sourceText);
  const energyLevel = detectEnergy(genre, detectedBpm, sourceText);
  const tags = collectTags({
    title,
    genre,
    musicalKey: detectedKey,
    energyLevel,
    kind,
    username,
  });

  return {
    bpm: detectedBpm || null,
    musicalKey: detectedKey || "",
    energyLevel,
    tags,
    analysisSource: "heuristic-auto-analysis",
  };
}

module.exports = {
  analyzeTrackMetadata,
};
