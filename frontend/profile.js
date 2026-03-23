const profileEls = {
  profileName: document.getElementById("profileName"),
  profileBio: document.getElementById("profileBio"),
  profileMeta: document.getElementById("profileMeta"),
  profileAvatar: document.getElementById("profileAvatar"),
  profileAvatarFallback: document.getElementById("profileAvatarFallback"),
  profileForm: document.getElementById("profileForm"),
  profileBioInput: document.getElementById("profileBioInput"),
  profileInterestsInput: document.getElementById("profileInterestsInput"),
  profileMsg: document.getElementById("profileMsg"),
  avatarForm: document.getElementById("avatarForm"),
  avatarFile: document.getElementById("avatarFile"),
  avatarMsg: document.getElementById("avatarMsg"),
  samples: document.getElementById("profileSamples"),
  samplesEmpty: document.getElementById("profileSamplesEmpty"),
  demos: document.getElementById("profileDemos"),
  demosEmpty: document.getElementById("profileDemosEmpty"),
  userSearchInput: document.getElementById("userSearchInput"),
  userSearchResults: document.getElementById("userSearchResults"),
};

function getOwnProfileId() {
  return localStorage.getItem("prodcty_userId") || "";
}

function trackCard(track) {
  const secondaryAction = track.isDownloadable
    ? `<a class="btn ghost" href="${API}${escapeHtml(track.downloadUrl || "")}">Download</a>`
    : "";

  return `
    <article class="library-card">
      <div class="card-chip">${escapeHtml(track.kind === "demo" ? "Demo" : track.genre || "sample")}</div>
      <h3>${escapeHtml(track.title)}</h3>
      <p class="muted">${escapeHtml(track.description || "No description yet.")}</p>
      <div class="meta-line">${escapeHtml(formatDuration(track.durationSec))} | ${escapeHtml(formatFileSize(track.fileSize))}</div>
      <div class="card-actions">
        <button class="btn primary" data-play="${escapeHtml(track.id)}">Play</button>
        ${secondaryAction}
      </div>
    </article>
  `;
}

function renderProfileUser(user) {
  const initial = (user.username || "P").slice(0, 1).toUpperCase();
  profileEls.profileName.textContent = user.username || "Unknown user";
  profileEls.profileBio.textContent = user.bio || "No bio yet.";
  profileEls.profileMeta.textContent = (user.interests || []).length
    ? `Interests: ${(user.interests || []).join(" | ")}`
    : "No interests listed yet.";

  if (profileEls.profileBioInput) {
    profileEls.profileBioInput.value = user.bio || "";
  }
  if (profileEls.profileInterestsInput) {
    profileEls.profileInterestsInput.value = (user.interests || []).join(", ");
  }
  profileEls.profileAvatarFallback.textContent = initial;

  if (user.avatarUrl) {
    profileEls.profileAvatar.src = buildMediaUrl(user.avatarUrl);
    profileEls.profileAvatar.style.display = "block";
    profileEls.profileAvatarFallback.style.display = "none";
  } else {
    profileEls.profileAvatar.removeAttribute("src");
    profileEls.profileAvatar.style.display = "none";
    profileEls.profileAvatarFallback.style.display = "grid";
  }
}

function renderTrackSection(items, container, emptyEl) {
  container.innerHTML = items.map(trackCard).join("");
  emptyEl.style.display = items.length ? "none" : "block";
}

async function loadProfile(userId) {
  const result = await apiFetch(`/users/${userId}`);
  if (!result.ok || !result.response.ok) {
    profileEls.profileName.textContent = "Profile unavailable";
    profileEls.profileBio.textContent = "This profile could not be loaded.";
    return;
  }

  renderProfileUser(result.data.user);
  renderTrackSection(result.data.samples || [], profileEls.samples, profileEls.samplesEmpty);
  renderTrackSection(result.data.demos || [], profileEls.demos, profileEls.demosEmpty);
}

async function searchUsers(query) {
  if (!query.trim()) {
    profileEls.userSearchResults.innerHTML = "";
    return;
  }

  const result = await apiFetch(`/users/search?q=${encodeURIComponent(query.trim())}`);
  if (!result.ok || !Array.isArray(result.data)) {
    profileEls.userSearchResults.innerHTML = "";
    return;
  }

  profileEls.userSearchResults.innerHTML = result.data
    .map((user) => `
      <a class="search-user" href="${publicProfileUrl(user.id)}">
        <span>${escapeHtml(user.username)}</span>
        <small>${escapeHtml((user.interests || []).slice(0, 2).join(" | ") || "View profile")}</small>
      </a>
    `)
    .join("");
}

profileEls.samples.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-play]");
  if (!button) return;
  const result = await apiFetch(`/tracks/${button.dataset.play}`);
  if (result.ok && result.response.ok) {
    playTrack(result.data);
  }
});

profileEls.demos.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-play]");
  if (!button) return;
  const result = await apiFetch(`/tracks/${button.dataset.play}`);
  if (result.ok && result.response.ok) {
    playTrack(result.data);
  }
});

profileEls.profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = getToken();
  if (!token) {
    setMsg(profileEls.profileMsg, "err", "You need to log in first.");
    return;
  }

  const interests = profileEls.profileInterestsInput.value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const result = await apiFetch("/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      bio: profileEls.profileBioInput.value,
      interests,
    }),
  });

  if (!result.ok || !result.response.ok) {
    setMsg(profileEls.profileMsg, "err", (result.data && result.data.error && result.data.error.message) || "Profile update failed.");
    return;
  }

  setMsg(profileEls.profileMsg, "ok", "Profile saved.");
  await loadProfile(result.data.user.id);
});

profileEls.avatarForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = getToken();
  const file = profileEls.avatarFile.files && profileEls.avatarFile.files[0];

  if (!token) {
    setMsg(profileEls.avatarMsg, "err", "You need to log in first.");
    return;
  }
  if (!file) {
    setMsg(profileEls.avatarMsg, "err", "Choose an image first.");
    return;
  }

  const formData = new FormData();
  formData.append("avatar", file);

  const result = await apiFetch("/me/avatar", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!result.ok || !result.response.ok) {
    setMsg(profileEls.avatarMsg, "err", (result.data && result.data.error && result.data.error.message) || "Avatar upload failed.");
    return;
  }

  setMsg(profileEls.avatarMsg, "ok", "Avatar updated.");
  profileEls.avatarForm.reset();
  refreshHeaderAvatar(result.data.user && result.data.user.avatarUrl ? result.data.user.avatarUrl : "");
  await loadProfile(result.data.user.id);
});

let searchTimer = null;
profileEls.userSearchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchUsers(profileEls.userSearchInput.value);
  }, 180);
});

initShell();
loadProfile(getOwnProfileId());
