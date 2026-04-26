export const INTEREST_OPTIONS = [
  "rock",
  "lofi",
  "metal",
  "hip hop",
  "trap",
  "house",
  "techno",
  "ambient",
  "jazz",
  "pop",
  "indie",
  "r&b",
  "soul",
  "funk",
  "reggae",
  "drum and bass",
  "cinematic",
  "classical",
  "folk",
  "experimental",
] as const;

export function normalizeInterestList(value: string[] | string) {
  const items = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(items.map((item) => String(item).trim().toLowerCase()).filter(Boolean))];
}

export function formatInterestLabel(value: string) {
  return String(value || "")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
