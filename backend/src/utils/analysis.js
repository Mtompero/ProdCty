"use strict";

const KEY_PATTERN = /\b([A-G](?:#|b)?m?)\b/i;
const BPM_PATTERN = /\b((?:[6-9]\d)|(?:1\d{2})|(?:2[0-2]\d))\s?bpm\b/i;

function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9#]+/i)
    .map((item) => item.trim())
    .filter(Boolean);
}

function detectBpm(sourceText) {
  const bpmMatch = String(sourceText || "").match(BPM_PATTERN);
  if (bpmMatch) {
    const parsed = Number(bpmMatch[1]);
    if (Number.isFinite(parsed) && parsed >= 60 && parsed <= 220) {
      return parsed;
    }
  }

  return null;
}

function detectMusicalKey(sourceText) {
  const match = String(sourceText || "").match(KEY_PATTERN);
  return match ? match[1] : "";
}

function detectEnergy(genre, bpm, sourceText) {
  const text = `${genre || ""} ${sourceText || ""}`.toLowerCase();

  if (/(ambient|drone|sleep|cinematic|soft|lofi|chill)/.test(text)) return "low";
  if (/(club|trap|drill|festival|hard|phonk|rage)/.test(text)) return "high";
  if (/(rock|metal|pop|indie|house|techno|jazz|soul|funk|reggae|drum and bass|dnb)/.test(text)) return "medium";

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

function hashText(value) {
  const text = String(value || "");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hslToHex(hue, saturation, lightness) {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const s = clamp(saturation, 0, 100) / 100;
  const l = clamp(lightness, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (normalizedHue < 60) {
    r = c; g = x; b = 0;
  } else if (normalizedHue < 120) {
    r = x; g = c; b = 0;
  } else if (normalizedHue < 180) {
    r = 0; g = c; b = x;
  } else if (normalizedHue < 240) {
    r = 0; g = x; b = c;
  } else if (normalizedHue < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (channel) => {
    const value = Math.round((channel + m) * 255);
    return value.toString(16).padStart(2, "0");
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function genreHue(genre) {
  const text = String(genre || "").toLowerCase();

  if (/(metal|hardcore|rage)/.test(text)) return 354;
  if (/(rock|garage|grunge)/.test(text)) return 16;
  if (/(lofi|chill)/.test(text)) return 184;
  if (/(hip hop|rap)/.test(text)) return 288;
  if (/(trap|drill)/.test(text)) return 265;
  if (/(house|club|dance)/.test(text)) return 158;
  if (/(techno)/.test(text)) return 196;
  if (/(ambient|dream|drone)/.test(text)) return 226;
  if (/(jazz)/.test(text)) return 36;
  if (/(pop)/.test(text)) return 326;
  if (/(indie)/.test(text)) return 84;
  if (/(r&b|rnb)/.test(text)) return 262;
  if (/(soul)/.test(text)) return 28;
  if (/(funk)/.test(text)) return 54;
  if (/(reggae|dub)/.test(text)) return 122;
  if (/(drum and bass|dnb|jungle)/.test(text)) return 172;
  if (/(cinematic)/.test(text)) return 224;
  if (/(classical|orchestral)/.test(text)) return 248;
  if (/(folk|acoustic)/.test(text)) return 92;
  if (/(experimental|glitch)/.test(text)) return 304;

  return 196;
}

function energyPalette(energyLevel) {
  if (energyLevel === "high") {
    return { saturation: 90, lightness: 50, label: "Intense" };
  }
  if (energyLevel === "low") {
    return { saturation: 72, lightness: 58, label: "Soft" };
  }
  return { saturation: 82, lightness: 52, label: "Balanced" };
}

function generateAura({ title, originalFileName, genre, bpm, musicalKey, energyLevel }) {
  const seed = `${title || ""}|${originalFileName || ""}|${genre || ""}|${bpm || ""}|${musicalKey || ""}|${energyLevel || ""}`;
  const hash = hashText(seed);
  const baseHue = genreHue(genre);
  const palette = energyPalette(energyLevel);
  const drift = (hash % 41) - 20;
  const primaryHue = baseHue + drift;
  const secondaryHue = primaryHue + 38 + (hash % 29);
  const accentHue = primaryHue + 180 + (hash % 25);
  const saturationShift = (hash % 13) - 6;
  const lightnessShift = ((hash >> 4) % 11) - 5;

  const primaryColor = hslToHex(primaryHue, palette.saturation + saturationShift, palette.lightness + lightnessShift);
  const secondaryColor = hslToHex(secondaryHue, palette.saturation - 4, palette.lightness - 8);
  const accentColor = hslToHex(accentHue, palette.saturation + 6, palette.lightness + 6);

  return {
    primaryColor,
    secondaryColor,
    accentColor,
    gradient: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor} 58%, ${accentColor})`,
    moodLabel: `${palette.label} ${String(genre || "unknown").trim().toLowerCase() || "unknown"} aura`,
  };
}

function analyzeTrackMetadata({ title, originalFileName, genre, bpm, musicalKey, durationSec, kind, username }) {
  const sourceText = `${title || ""} ${originalFileName || ""} ${genre || ""}`.trim();
  const detectedBpm = bpm || detectBpm(sourceText);
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
    aura: generateAura({
      title,
      originalFileName,
      genre,
      bpm: detectedBpm,
      musicalKey: detectedKey,
      energyLevel,
    }),
    analysisSource: "heuristic-auto-analysis",
  };
}

module.exports = {
  analyzeTrackMetadata,
  generateAura,
};
