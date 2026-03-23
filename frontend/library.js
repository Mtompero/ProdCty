const libraryEls = {
  uploadForm: document.getElementById("uploadForm"),
  uploadMsg: document.getElementById("uploadMsg"),
  audioFile: document.getElementById("audioFile"),
  audioFileMeta: document.getElementById("audioFileMeta"),
  sampleGrid: document.getElementById("sampleGrid"),
  emptyState: document.getElementById("emptyState"),
  refreshBtn: document.getElementById("refreshBtn"),
  sampleCount: document.getElementById("sampleCount"),
  genreCount: document.getElementById("genreCount"),
};

function sampleCard(track) {
  return `
    <article class="library-card">
      <div class="card-chip">${escapeHtml(track.genre || "unknown")}</div>
      <h3>${escapeHtml(track.title)}</h3>
      <p class="muted">${escapeHtml(track.description || "No description yet.")}</p>
      <div class="meta-line">${renderUserLink(track.userId, track.username)} | ${escapeHtml(track.musicalKey || "-")}</div>
      <div class="meta-line">${escapeHtml(formatDuration(track.durationSec))} | ${escapeHtml(formatFileSize(track.fileSize))} | ${escapeHtml(track.bpm ? `${track.bpm} BPM` : "no BPM")}</div>
      <div class="card-actions">
        <button class="btn primary" data-play="${escapeHtml(track.id)}">Play</button>
        <a class="btn ghost" href="${API}${escapeHtml(track.downloadUrl || "")}">Download</a>
      </div>
    </article>
  `;
}

async function loadSamples() {
  const result = await apiFetch("/tracks?kind=sample");
  if (!result.ok) {
    libraryEls.sampleGrid.innerHTML = "";
    libraryEls.emptyState.style.display = "block";
    libraryEls.emptyState.textContent = "The backend is currently unreachable.";
    return [];
  }

  const items = Array.isArray(result.data) ? result.data : [];
  libraryEls.sampleGrid.innerHTML = items.map(sampleCard).join("");
  libraryEls.emptyState.style.display = items.length ? "none" : "block";
  libraryEls.sampleCount.textContent = String(items.length);
  libraryEls.genreCount.textContent = String(new Set(items.map((item) => item.genre || "unknown")).size);
  return items;
}

libraryEls.audioFile.addEventListener("change", () => {
  const file = libraryEls.audioFile.files && libraryEls.audioFile.files[0];
  libraryEls.audioFileMeta.textContent = file
    ? `${file.name} | ${formatFileSize(file.size)} | ${file.type || "audio"}`
    : "No audio file selected.";
});

libraryEls.sampleGrid.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-play]");
  if (!button) return;

  const result = await apiFetch(`/tracks/${button.dataset.play}`);
  if (result.ok && result.response.ok) {
    playTrack(result.data);
  }
});

libraryEls.uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = getToken();
  if (!token) {
    setMsg(libraryEls.uploadMsg, "err", "You need to log in before uploading.");
    return;
  }

  const file = libraryEls.audioFile.files && libraryEls.audioFile.files[0];
  if (!file) {
    setMsg(libraryEls.uploadMsg, "err", "Choose an audio file first.");
    return;
  }

  setMsg(libraryEls.uploadMsg, "", "Uploading sample...");

  try {
    const formData = await buildTrackUploadFormData(libraryEls.uploadForm, file, "sample");

    const result = await apiFetch("/tracks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!result.ok || !result.response.ok) {
      setMsg(libraryEls.uploadMsg, "err", (result.data && result.data.error && result.data.error.message) || "Upload failed.");
      return;
    }

    setMsg(libraryEls.uploadMsg, "ok", "Sample uploaded.");
    libraryEls.uploadForm.reset();
    libraryEls.audioFileMeta.textContent = "No audio file selected.";
    playTrack(result.data);
    await loadSamples();
  } catch (error) {
    setMsg(libraryEls.uploadMsg, "err", error.message || "Upload failed.");
  }
});

libraryEls.refreshBtn.addEventListener("click", loadSamples);

initShell();
loadSamples();
