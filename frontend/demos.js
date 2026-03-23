const demoEls = {
  uploadForm: document.getElementById("demoUploadForm"),
  uploadMsg: document.getElementById("demoUploadMsg"),
  audioFile: document.getElementById("demoAudioFile"),
  audioMeta: document.getElementById("demoAudioMeta"),
  demoGrid: document.getElementById("demoGrid"),
  demoEmpty: document.getElementById("demoEmpty"),
  refreshBtn: document.getElementById("refreshBtn"),
  selectedDemoTitle: document.getElementById("selectedDemoTitle"),
  selectedDemoMeta: document.getElementById("selectedDemoMeta"),
  playDemoBtn: document.getElementById("playDemoBtn"),
  ratingForm: document.getElementById("ratingForm"),
  ratingTrackId: document.getElementById("ratingTrackId"),
  ratingMsg: document.getElementById("ratingMsg"),
  ratingSummary: document.getElementById("ratingSummary"),
  ratingList: document.getElementById("ratingList"),
};

let selectedDemo = null;

function demoCard(track) {
  return `
    <article class="library-card demo-card">
      <div class="card-chip">Demo</div>
      <h3>${escapeHtml(track.title)}</h3>
      <p class="muted">${escapeHtml(track.description || "No description yet.")}</p>
      <div class="meta-line">${escapeHtml(track.username || "unknown")} | ${escapeHtml(track.genre || "unknown")} | ${escapeHtml(track.bpm ? `${track.bpm} BPM` : "no BPM")}</div>
      <div class="meta-line">Rating: ${escapeHtml(formatRating(track.ratingAverage, track.ratingCount))}</div>
      <div class="card-actions">
        <button class="btn primary" data-select="${escapeHtml(track.id)}">Review</button>
        <button class="btn" data-play="${escapeHtml(track.id)}">Play</button>
      </div>
    </article>
  `;
}

async function loadDemos() {
  const result = await apiFetch("/demos");
  if (!result.ok) {
    demoEls.demoGrid.innerHTML = "";
    demoEls.demoEmpty.style.display = "block";
    demoEls.demoEmpty.textContent = "The backend is currently unreachable.";
    return [];
  }

  const items = Array.isArray(result.data) ? result.data : [];
  demoEls.demoGrid.innerHTML = items.map(demoCard).join("");
  demoEls.demoEmpty.style.display = items.length ? "none" : "block";
  return items;
}

function setSelectedDemo(track) {
  selectedDemo = track;
  demoEls.ratingTrackId.value = track ? track.id : "";
  demoEls.selectedDemoTitle.textContent = track ? track.title : "Nothing selected";
  demoEls.selectedDemoMeta.textContent = track
    ? `${track.username || "unknown"} | ${track.genre || "unknown"} | ${formatRating(track.ratingAverage, track.ratingCount)}`
    : "Choose a demo.";
}

async function loadRatings(trackId) {
  const result = await apiFetch(`/tracks/${trackId}/ratings`);
  if (!result.ok || !result.response.ok) {
    demoEls.ratingSummary.textContent = "Failed to load ratings.";
    demoEls.ratingList.textContent = "";
    return;
  }

  const items = result.data && Array.isArray(result.data.items) ? result.data.items : [];
  demoEls.ratingSummary.textContent = `Average: ${formatRating(result.data.average, result.data.count)}`;
  demoEls.ratingList.innerHTML = items.length
    ? items
        .map((rating) => `
          <div class="comment-row">
            <strong>${escapeHtml(rating.author)}</strong>
            <span>${escapeHtml(`${rating.score}/5`)}</span>
            <span>${escapeHtml(rating.text || "No written feedback yet.")}</span>
            <span class="muted">${escapeHtml(fmtDate(rating.updatedAt))}</span>
          </div>
        `)
        .join("")
    : "No ratings for this demo yet.";
}

demoEls.audioFile.addEventListener("change", () => {
  const file = demoEls.audioFile.files && demoEls.audioFile.files[0];
  demoEls.audioMeta.textContent = file
    ? `${file.name} | ${formatFileSize(file.size)} | ${file.type || "audio"}`
    : "No demo file selected.";
});

demoEls.demoGrid.addEventListener("click", async (event) => {
  const selectBtn = event.target.closest("[data-select]");
  const playBtn = event.target.closest("[data-play]");
  const trackId = selectBtn ? selectBtn.dataset.select : playBtn ? playBtn.dataset.play : "";
  if (!trackId) return;

  const result = await apiFetch(`/tracks/${trackId}`);
  if (!result.ok || !result.response.ok) return;

  if (selectBtn) {
    setSelectedDemo(result.data);
    await loadRatings(trackId);
  }
  if (playBtn) {
    playTrack(result.data);
  }
});

demoEls.playDemoBtn.addEventListener("click", () => {
  if (selectedDemo) {
    playTrack(selectedDemo);
  }
});

demoEls.uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = getToken();
  if (!token) {
    setMsg(demoEls.uploadMsg, "err", "You need to log in before uploading demos.");
    return;
  }

  const file = demoEls.audioFile.files && demoEls.audioFile.files[0];
  if (!file) {
    setMsg(demoEls.uploadMsg, "err", "Choose a demo file first.");
    return;
  }

  setMsg(demoEls.uploadMsg, "", "Uploading demo...");

  try {
    const formData = await buildTrackUploadFormData(demoEls.uploadForm, file, "demo");

    const result = await apiFetch("/tracks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!result.ok || !result.response.ok) {
      setMsg(demoEls.uploadMsg, "err", (result.data && result.data.error && result.data.error.message) || "Demo upload failed.");
      return;
    }

    setMsg(demoEls.uploadMsg, "ok", "Demo uploaded.");
    demoEls.uploadForm.reset();
    demoEls.audioMeta.textContent = "No demo file selected.";
    setSelectedDemo(result.data);
    playTrack(result.data);
    await loadDemos();
    await loadRatings(result.data.id);
  } catch (error) {
    setMsg(demoEls.uploadMsg, "err", error.message || "Demo upload failed.");
  }
});

demoEls.ratingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = getToken();
  const trackId = demoEls.ratingTrackId.value;
  if (!token) {
    setMsg(demoEls.ratingMsg, "err", "You need to log in before rating demos.");
    return;
  }
  if (!trackId) {
    setMsg(demoEls.ratingMsg, "err", "Choose a demo first.");
    return;
  }

  const formData = new FormData(demoEls.ratingForm);
  const result = await apiFetch(`/tracks/${trackId}/ratings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      score: Number(formData.get("score")),
      text: formData.get("text"),
    }),
  });

  if (!result.ok || !result.response.ok) {
    setMsg(demoEls.ratingMsg, "err", (result.data && result.data.error && result.data.error.message) || "Saving the rating failed.");
    return;
  }

  setMsg(demoEls.ratingMsg, "ok", "Rating saved.");
  await loadDemos();
  await loadRatings(trackId);
});

demoEls.refreshBtn.addEventListener("click", loadDemos);

initShell();
loadDemos();
