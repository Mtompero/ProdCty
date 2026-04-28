export function escapeFallback(value: string | null | undefined, fallback: string) {
  return value && value.trim().length ? value : fallback;
}

export function isAbsoluteUrl(value?: string | null) {
  return /^https?:\/\//i.test(String(value || ""));
}

export function buildApiUrl(path?: string | null, cacheBust = false) {
  if (!path) return "";
  const url = isAbsoluteUrl(path) ? path : `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${path}`;
  return cacheBust ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` : url;
}

export function buildMediaUrl(path?: string | null) {
  return buildApiUrl(path, true);
}

export function formatDuration(seconds?: number | null) {
  const total = Math.round(Number(seconds));
  if (!Number.isFinite(total) || total <= 0) return "unknown duration";
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function formatTimestamp(seconds?: number | null) {
  const value = Math.round(Number(seconds));
  if (!Number.isFinite(value) || value < 0) return "00:00";
  const mins = Math.floor(value / 60);
  const secs = value % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function formatFileSize(bytes?: number | null) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return "unknown size";
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRating(value?: number, count?: number) {
  const rating = Number(value || 0);
  const ratingCount = Number(count || 0);
  if (!ratingCount) return "No ratings yet";
  return `${rating.toFixed(1)}/5 (${ratingCount})`;
}
