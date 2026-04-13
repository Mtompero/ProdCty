const profileViewEls = {
  profileName: document.getElementById("profileName"),
  profileBio: document.getElementById("profileBio"),
  profileMeta: document.getElementById("profileMeta"),
  profileStats: document.getElementById("profileStats"),
  profileAvatar: document.getElementById("profileAvatar"),
  profileAvatarFallback: document.getElementById("profileAvatarFallback"),
  samples: document.getElementById("profileSamples"),
  samplesEmpty: document.getElementById("profileSamplesEmpty"),
  demos: document.getElementById("profileDemos"),
  demosEmpty: document.getElementById("profileDemosEmpty"),
};

function getViewedProfileId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || "";
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
      <div class="meta-line">${escapeHtml(formatDuration(track.durationSec))} | ${escapeHtml(formatFileSize(track.fileSize))} | ${escapeHtml(track.bpm ? `${track.bpm} BPM` : "no BPM")} | ${escapeHtml(track.energyLevel || "medium")} energy</div>
      <div class="card-actions">
        <button class="btn primary" data-play="${escapeHtml(track.id)}">Play</button>
        ${secondaryAction}
      </div>
    </article>
  `;
}

function renderProfileStats(stats) {
  if (!profileViewEls.profileStats) return;
  profileViewEls.profileStats.innerHTML = `
    <div class="stat-card"><span>Uploads</span><strong>${escapeHtml(stats.totalUploads || 0)}</strong></div>
    <div class="stat-card"><span>Plays</span><strong>${escapeHtml(stats.totalPlays || 0)}</strong></div>
    <div class="stat-card"><span>Reviews</span><strong>${escapeHtml(stats.totalRatings || 0)}</strong></div>
  `;
}

function renderTrackSection(items, container, emptyEl) {
  container.innerHTML = items.map(trackCard).join("");
  emptyEl.style.display = items.length ? "none" : "block";
}

function renderProfileUser(user) {
  const initial = (user.username || "P").slice(0, 1).toUpperCase();
  profileViewEls.profileName.textContent = user.username || "Unknown user";
  profileViewEls.profileBio.textContent = user.bio || "No bio yet.";
  profileViewEls.profileMeta.textContent = (user.interests || []).length
    ? `Interests: ${(user.interests || []).join(" | ")}`
    : "No interests listed yet.";
  profileViewEls.profileAvatarFallback.textContent = initial;

  if (user.avatarUrl) {
    profileViewEls.profileAvatar.src = buildMediaUrl(user.avatarUrl);
    profileViewEls.profileAvatar.style.display = "block";
    profileViewEls.profileAvatarFallback.style.display = "none";
  } else {
    profileViewEls.profileAvatar.removeAttribute("src");
    profileViewEls.profileAvatar.style.display = "none";
    profileViewEls.profileAvatarFallback.style.display = "grid";
  }
}

async function loadProfile(userId) {
  if (!userId) {
    profileViewEls.profileName.textContent = "Profile unavailable";
    profileViewEls.profileBio.textContent = "No creator was selected.";
    return;
  }

  const result = await apiFetch(`/users/${userId}`);
  if (!result.ok || !result.response.ok) {
    profileViewEls.profileName.textContent = "Profile unavailable";
    profileViewEls.profileBio.textContent = "This profile could not be loaded.";
    return;
  }

  renderProfileUser(result.data.user);
  renderProfileStats(result.data.stats || {});
  renderTrackSection(result.data.samples || [], profileViewEls.samples, profileViewEls.samplesEmpty);
  renderTrackSection(result.data.demos || [], profileViewEls.demos, profileViewEls.demosEmpty);
}

profileViewEls.samples.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-play]");
  if (!button) return;
  const result = await apiFetch(`/tracks/${button.dataset.play}`);
  if (result.ok && result.response.ok) {
    playTrack(result.data);
  }
});

profileViewEls.demos.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-play]");
  if (!button) return;
  const result = await apiFetch(`/tracks/${button.dataset.play}`);
  if (result.ok && result.response.ok) {
    playTrack(result.data);
  }
});

initShell();
loadProfile(getViewedProfileId());
