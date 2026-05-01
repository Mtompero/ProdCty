"use strict";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";

const SUSPICIOUS_PATTERNS = [
  { pattern: /\byoutube\b|\byt\b/i, reason: "Metadata mentions YouTube as a possible source." },
  { pattern: /\brip(ped)?\b|\bripped\b/i, reason: "Metadata suggests the audio may be ripped from another source." },
  { pattern: /\bsplice\b|\bcymatics\b|\bloops?erman\b|\bkontakt\b/i, reason: "Metadata mentions a third-party sample provider or pack." },
  { pattern: /\bdrake\b|\bkanye\b|\btaylor swift\b|\bbillie eilish\b|\bthe weeknd\b/i, reason: "Metadata references a known commercial artist." },
  { pattern: /\bofficial\b|\bremix\b|\bstem\b|\bacapella\b|\binstrumental\b/i, reason: "Metadata may indicate copyrighted derivative material." },
  { pattern: /\bdownload(ed)? from\b|\bfree pack\b|\bsample pack\b/i, reason: "Metadata suggests unclear redistribution rights." },
];

function getScreeningMode() {
  const raw = String(process.env.AI_SAMPLE_SCREENING_ENABLED || "auto").trim().toLowerCase();
  if (["0", "false", "off", "disabled"].includes(raw)) return "disabled";
  if (["1", "true", "on", "enabled"].includes(raw)) return "enabled";
  return process.env.OPENAI_API_KEY ? "enabled" : "fallback";
}

function normalizeRisk(result, source) {
  const riskLevel = result && result.riskLevel === "suspicious" ? "suspicious" : "clear";
  const suggestedAction = riskLevel === "suspicious" ? "manual_review" : "allow";
  const riskReasons = Array.isArray(result && result.riskReasons)
    ? result.riskReasons.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
    : [];

  return {
    aiRiskLevel: riskLevel,
    aiRiskReasons: riskReasons,
    aiSuggestedAction: result && ["allow", "manual_review"].includes(result.suggestedAction) ? result.suggestedAction : suggestedAction,
    aiAdminNote: String((result && result.adminNote) || (riskLevel === "suspicious" ? "Manual review is recommended." : "No obvious metadata risk detected.")).slice(0, 500),
    aiRiskSource: source,
    aiCheckedAt: new Date(),
  };
}

function runRuleBasedScreening(metadata) {
  const haystack = [
    metadata.title,
    metadata.originalFileName,
    metadata.description,
    metadata.genre,
    Array.isArray(metadata.tags) ? metadata.tags.join(" ") : metadata.tags,
  ].filter(Boolean).join(" ");

  const reasons = SUSPICIOUS_PATTERNS
    .filter(({ pattern }) => pattern.test(haystack))
    .map(({ reason }) => reason);

  return normalizeRisk({
    riskLevel: reasons.length ? "suspicious" : "clear",
    riskReasons: [...new Set(reasons)],
    suggestedAction: reasons.length ? "manual_review" : "allow",
    adminNote: reasons.length
      ? "Metadata contains terms that may indicate unclear licensing or third-party source material."
      : "No obvious metadata risk detected by fallback screening.",
  }, "rule");
}

function extractOutputText(responseJson) {
  if (typeof responseJson.output_text === "string") return responseJson.output_text;
  const output = Array.isArray(responseJson.output) ? responseJson.output : [];
  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (typeof part.text === "string") return part.text;
      if (typeof part.output_text === "string") return part.output_text;
    }
  }
  return "";
}

async function runOpenAiScreening(metadata) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return runRuleBasedScreening(metadata);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const model = process.env.OPENAI_SAMPLE_RISK_MODEL || DEFAULT_MODEL;

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: "You are a cautious music platform moderation assistant. Analyze sample upload metadata for licensing, spam, or unclear-source risk. Do not make legal conclusions. Return only the requested JSON.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Assess whether this royalty-free sample upload should be flagged for admin review.",
              policy: "If metadata mentions YouTube, ripping, commercial artists, paid packs, third-party sample packs, official songs, stems, or unclear redistribution rights, mark suspicious. Otherwise mark clear. The uploader's license confirmation is only a declaration, not proof.",
              metadata,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "sample_risk_screening",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                riskLevel: { type: "string", enum: ["clear", "suspicious"] },
                riskReasons: {
                  type: "array",
                  maxItems: 5,
                  items: { type: "string" },
                },
                suggestedAction: { type: "string", enum: ["allow", "manual_review"] },
                adminNote: { type: "string" },
              },
              required: ["riskLevel", "riskReasons", "suggestedAction", "adminNote"],
            },
          },
        },
        max_output_tokens: 350,
      }),
    });

    if (!response.ok) {
      return { ...runRuleBasedScreening(metadata), aiRiskSource: "error" };
    }

    const responseJson = await response.json();
    const outputText = extractOutputText(responseJson);
    const parsed = JSON.parse(outputText);
    return normalizeRisk(parsed, "openai");
  } catch (err) {
    return { ...runRuleBasedScreening(metadata), aiRiskSource: "error" };
  } finally {
    clearTimeout(timeout);
  }
}

async function screenSampleRisk(metadata) {
  const mode = getScreeningMode();
  if (mode === "disabled") {
    return {
      aiRiskLevel: "unknown",
      aiRiskReasons: [],
      aiSuggestedAction: "unknown",
      aiAdminNote: "AI sample risk screening is disabled.",
      aiRiskSource: "disabled",
      aiCheckedAt: null,
    };
  }
  if (mode === "fallback") {
    return runRuleBasedScreening(metadata);
  }
  return runOpenAiScreening(metadata);
}

module.exports = {
  screenSampleRisk,
  runRuleBasedScreening,
};
