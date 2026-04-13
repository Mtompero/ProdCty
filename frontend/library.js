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
  analysisCount: document.getElementById("analysisCount"),
  filterForm: document.getElementById("filterForm"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),
};

function renderPreviewBars(track) {
  const duration = Number(track.durationSec || 0);
  const count = 28;

  return Array.from({ length: count }, (_, index) => {
    const waveSeed = ((index * 7) + duration * 3) % 11;
    const height = 10 + waveSeed * 2;
    return `<span style="height:${height}px; --bar-height:${height}px; --bar-delay:${(index % 8) * 0.08}s"></span>`;
  }).join("");
}

function sampleCard(track) {
  return `
    <article class="library-row" data-track-id="${escapeHtml(track.id)}">
      <div class="library-row-main">
        <div class="library-row-art">${escapeHtml((track.genre || "fx").slice(0, 2).toUpperCase())}</div>
        <div class="library-row-copy">
          <h3>${escapeHtml(track.title)}</h3>
          <div class="meta-line">${renderUserLink(track.userId, track.username)} | ${escapeHtml(track.genre || "unknown")} | ${escapeHtml(formatFileSize(track.fileSize))}</div>
          <div class="library-row-tags">${(track.tags || []).slice(0, 4).map((tag) => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join("")}</div>
        </div>
      </div>
      <div class="library-row-preview" aria-hidden="true">${renderPreviewBars(track)}</div>
      <div class="library-row-stat">${escapeHtml(formatDuration(track.durationSec))}</div>
      <div class="library-row-stat">${escapeHtml(track.musicalKey || "--")}</div>
      <div class="library-row-stat">${escapeHtml(track.bpm ? `${track.bpm}` : "--")}</div>
      <div class="library-row-actions">
        <button class="btn primary" data-play="${escapeHtml(track.id)}">Play</button>
        <a class="btn ghost" href="${API}${escapeHtml(track.downloadUrl || "")}">Download</a>
      </div>
    </article>
  `;
}

function updateActivePreview(trackId, isPlaying) {
  document.querySelectorAll(".library-row.is-playing").forEach((row) => {
    row.classList.remove("is-playing");
  });

  if (!trackId || !isPlaying) return;

  const activeRow = libraryEls.sampleGrid.querySelector(`.library-row[data-track-id="${CSS.escape(trackId)}"]`);
  if (activeRow) {
    activeRow.classList.add("is-playing");
  }
}

function buildTrackQuery(form) {
  const params = new URLSearchParams({ kind: "sample" });
  const formData = new FormData(form);
  for (const [key, value] of formData.entries()) {
    if (String(value || "").trim()) {
      params.set(key, String(value).trim());
    }
  }
  return params.toString();
}

async function loadSamples() {
  const query = libraryEls.filterForm ? buildTrackQuery(libraryEls.filterForm) : "kind=sample";
  const result = await apiFetch(`/tracks?${query}`);
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
  libraryEls.analysisCount.textContent = String(items.filter((item) => item.analysisSource && item.analysisSource !== "manual").length);
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
libraryEls.filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadSamples();
});
libraryEls.clearFiltersBtn.addEventListener("click", () => {
  libraryEls.filterForm.reset();
  loadSamples();
});

initShell();
loadSamples();

window.addEventListener("prodcty:player-state", (event) => {
  const detail = event.detail || {};
  updateActivePreview(detail.trackId || "", Boolean(detail.isPlaying));
});
