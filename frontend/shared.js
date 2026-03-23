const API = "http://localhost:3000";
const PLAYER_KEY = "prodcty_now_playing";

function getToken() {
  return localStorage.getItem("prodcty_token") || "";
}

function getUsername() {
  return localStorage.getItem("prodcty_username") || "";
}

function setMsg(el, kind, text) {
  if (!el) return;
  el.className = "msg" + (kind ? " " + kind : "");
  el.textContent = text || "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function profileUrl() {
  return "./profile.html";
}

function publicProfileUrl(userId) {
  return userId ? `./profile-view.html?id=${encodeURIComponent(userId)}` : "./profile-view.html";
}

function buildMediaUrl(path) {
  return path ? `${API}${path}${path.includes("?") ? "&" : "?"}t=${Date.now()}` : "";
}

function renderUserLink(userId, username, className = "user-link") {
  const safeName = escapeHtml(username || "unknown");
  if (!userId) {
    return `<span class="${className} is-static">${safeName}</span>`;
  }
  return `<a class="${className}" href="${publicProfileUrl(userId)}">${safeName}</a>`;
}

function refreshHeaderAvatar(avatarUrl) {
  const headerAvatar = document.getElementById("headerAvatar");
  if (!headerAvatar) return;
  headerAvatar.src = avatarUrl ? buildMediaUrl(avatarUrl) : "./assets/avatar-placeholder.svg";
}

function fmtDate(value) {
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

function formatDuration(seconds) {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) return "unknown duration";
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatFileSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return "unknown size";
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatRating(value, count) {
  const rating = Number(value || 0);
  const ratingCount = Number(count || 0);
  if (!ratingCount) return "No ratings yet";
  return `${rating.toFixed(1)}/5 (${ratingCount})`;
}

async function apiFetch(path, options = {}) {
  try {
    const response = await fetch(`${API}${path}`, options);
    const data = await response.json().catch(() => null);
    return { ok: true, response, data };
  } catch (error) {
    return { ok: false, error };
  }
}

function getAudioDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");

    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? Math.round(audio.duration) : "";
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("");
    };
    audio.src = url;
  });
}

async function buildTrackUploadFormData(form, file, kind) {
  const formData = new FormData(form);
  const durationSec = await getAudioDuration(file);

  formData.set("kind", kind);
  formData.delete("audioFile");
  formData.append("audio", file);

  if (durationSec) {
    formData.set("durationSec", String(durationSec));
  }

  return formData;
}

function savePlayerTrack(track) {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(track));
}

function getSavedPlayerTrack() {
  try {
    return JSON.parse(localStorage.getItem(PLAYER_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function mountBottomPlayer() {
  const titleEl = document.getElementById("bottomPlayerTitle");
  const infoEl = document.getElementById("bottomPlayerInfo");
  const audioEl = document.getElementById("bottomPlayerAudio");
  const saved = getSavedPlayerTrack();

  if (!titleEl || !infoEl || !audioEl || !saved || !saved.audioUrl) return;

  titleEl.textContent = saved.title || "Unknown track";
  infoEl.textContent = `${saved.username || "Unknown"} | ${saved.genre || "unknown"} | ${formatDuration(saved.durationSec)}`;
  audioEl.src = `${API}${saved.audioUrl}`;
}

function playTrack(track) {
  const titleEl = document.getElementById("bottomPlayerTitle");
  const infoEl = document.getElementById("bottomPlayerInfo");
  const audioEl = document.getElementById("bottomPlayerAudio");

  if (!titleEl || !infoEl || !audioEl || !track || !track.audioUrl) return;

  savePlayerTrack(track);
  titleEl.textContent = track.title || "Unknown track";
  infoEl.textContent = `${track.username || "Unknown"} | ${track.genre || "unknown"} | ${formatDuration(track.durationSec)} | ${formatFileSize(track.fileSize)}`;
  audioEl.src = `${API}${track.audioUrl}`;
  audioEl.play().catch(() => {});
}

function initShell() {
  const currentPage = document.body.dataset.page;
  const loginStatus = document.getElementById("loginStatus");
  const logoutBtn = document.getElementById("logoutBtn");
  const authLink = document.getElementById("authLink");
  const profileLink = document.getElementById("profileLink");
  const headerAvatar = document.getElementById("headerAvatar");
  const loggedIn = Boolean(getToken());

  document.body.classList.add("page-enter");
  requestAnimationFrame(() => {
    document.body.classList.add("page-enter-active");
  });

  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === currentPage) {
      link.classList.add("active");
    }

    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      event.preventDefault();
      document.body.classList.add("page-leave");
      setTimeout(() => {
        window.location.href = href;
      }, 220);
    });
  });

  if (loginStatus) {
    loginStatus.textContent = "";
    loginStatus.style.display = "none";
  }

  if (authLink) {
    authLink.style.display = loggedIn ? "none" : "inline-flex";
  }

  if (profileLink) {
    profileLink.style.display = loggedIn ? "inline-flex" : "none";
    profileLink.href = profileUrl();
  }

  if (loggedIn && headerAvatar) {
    apiFetch("/me").then((result) => {
      const user = result.ok && result.response && result.response.ok && result.data ? result.data.user : null;
      refreshHeaderAvatar(user && user.avatarUrl ? user.avatarUrl : "");
    });
  }

  if (logoutBtn) {
    logoutBtn.style.display = loggedIn ? "inline-flex" : "none";
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("prodcty_token");
      localStorage.removeItem("prodcty_username");
      localStorage.removeItem("prodcty_userId");
      window.location.href = "./auth.html";
    });
  }

  mountBottomPlayer();
}
