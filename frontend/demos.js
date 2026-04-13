const demoEls = {
  uploadForm: document.getElementById("demoUploadForm"),
  uploadMsg: document.getElementById("demoUploadMsg"),
  audioFile: document.getElementById("demoAudioFile"),
  audioMeta: document.getElementById("demoAudioMeta"),
  demoGrid: document.getElementById("demoGrid"),
  demoEmpty: document.getElementById("demoEmpty"),
  demoPickerList: document.getElementById("demoPickerList"),
  refreshBtn: document.getElementById("refreshBtn"),
  selectedDemoTitle: document.getElementById("selectedDemoTitle"),
  selectedDemoMeta: document.getElementById("selectedDemoMeta"),
  playDemoBtn: document.getElementById("playDemoBtn"),
  ratingForm: document.getElementById("ratingForm"),
  ratingTrackId: document.getElementById("ratingTrackId"),
  ratingMsg: document.getElementById("ratingMsg"),
  ratingSummary: document.getElementById("ratingSummary"),
  ratingList: document.getElementById("ratingList"),
  feedbackForm: document.getElementById("feedbackForm"),
  feedbackTrackId: document.getElementById("feedbackTrackId"),
  feedbackTimestamp: document.getElementById("feedbackTimestamp"),
  feedbackTimestampLabel: document.getElementById("feedbackTimestampLabel"),
  feedbackMsg: document.getElementById("feedbackMsg"),
  feedbackList: document.getElementById("feedbackList"),
  useCurrentTimeBtn: document.getElementById("useCurrentTimeBtn"),
};

let selectedDemo = null;

function pickerItem(track) {
  const activeClass = selectedDemo && selectedDemo.id === track.id ? " active" : "";
  return `
    <button class="picker-item${activeClass}" type="button" data-pick="${escapeHtml(track.id)}">
      <strong>${escapeHtml(track.title)}</strong>
      <span>${escapeHtml(track.username || "unknown")} | ${escapeHtml(track.genre || "unknown")}</span>
      <span>${escapeHtml(formatDuration(track.durationSec))} | ${escapeHtml(track.musicalKey || "-")}</span>
    </button>
  `;
}

function demoCard(track) {
  return `
    <article class="library-card demo-card">
      <div class="card-chip">Demo</div>
      <h3>${escapeHtml(track.title)}</h3>
      <p class="muted">${escapeHtml(track.description || "No description yet.")}</p>
      <div class="meta-line">${renderUserLink(track.userId, track.username)} | ${escapeHtml(track.genre || "unknown")} | ${escapeHtml(track.bpm ? `${track.bpm} BPM` : "no BPM")} | ${escapeHtml(track.energyLevel || "medium")} energy</div>
      <div class="meta-line">Rating: ${escapeHtml(formatRating(track.ratingAverage, track.ratingCount))}</div>
      <div class="card-actions">
        <button class="btn primary" data-select="${escapeHtml(track.id)}">Review</button>
        <button class="btn" data-play="${escapeHtml(track.id)}">Play</button>
      </div>
    </article>
  `;
}

async function fetchTrackById(trackId) {
  const result = await apiFetch(`/tracks/${trackId}`);
  if (!result.ok || !result.response.ok) return null;
  return result.data;
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
  demoEls.demoPickerList.innerHTML = items.length ? items.map(pickerItem).join("") : "No demos available yet.";
  demoEls.demoEmpty.style.display = items.length ? "none" : "block";
  return items;
}

function setSelectedDemo(track) {
  selectedDemo = track;
  demoEls.ratingTrackId.value = track ? track.id : "";
  demoEls.feedbackTrackId.value = track ? track.id : "";
  demoEls.selectedDemoTitle.textContent = track ? track.title : "Nothing selected";
  demoEls.selectedDemoMeta.textContent = track
    ? `${track.username || "unknown"} | ${track.genre || "unknown"} | ${formatRating(track.ratingAverage, track.ratingCount)} | ${track.musicalKey || "-"}`
    : "Choose a demo.";
  demoEls.feedbackTimestamp.value = "";
  if (demoEls.feedbackTimestampLabel) {
    demoEls.feedbackTimestampLabel.textContent = "00:00";
  }
  const pickerButtons = demoEls.demoPickerList.querySelectorAll("[data-pick]");
  pickerButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.pick === track.id);
  });
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

async function loadFeedback(trackId) {
  const result = await apiFetch(`/tracks/${trackId}/comments`);
  if (!result.ok || !result.response.ok) {
    demoEls.feedbackList.textContent = "Failed to load feedback.";
    return;
  }

  const items = Array.isArray(result.data) ? result.data : [];
  demoEls.feedbackList.innerHTML = items.length
    ? items
        .map((comment) => `
          <div class="comment-row">
            <strong>${escapeHtml(comment.author || "anonymous")}</strong>
            <span class="meta-line">${escapeHtml(formatTimestamp(comment.timestampSec || 0))} | ${escapeHtml(comment.category || "general")}</span>
            <span>${escapeHtml(comment.text || "")}</span>
            <span class="muted">${escapeHtml(fmtDate(comment.createdAt))}</span>
          </div>
        `)
        .join("")
    : "No timestamped feedback for this demo yet.";
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

  const track = await fetchTrackById(trackId);
  if (!track) return;

  if (selectBtn) {
    setSelectedDemo(track);
    playTrack(track);
    await loadRatings(trackId);
    await loadFeedback(trackId);
  }

  if (playBtn) {
    setSelectedDemo(track);
    playTrack(track);
  }
});

demoEls.demoPickerList.addEventListener("click", async (event) => {
  const pickBtn = event.target.closest("[data-pick]");
  if (!pickBtn) return;
  const track = await fetchTrackById(pickBtn.dataset.pick);
  if (!track) return;
  setSelectedDemo(track);
  playTrack(track);
  await loadRatings(track.id);
  await loadFeedback(track.id);
});

demoEls.playDemoBtn.addEventListener("click", async () => {
  if (!selectedDemo) return;
  const track = await fetchTrackById(selectedDemo.id);
  if (!track) return;
  setSelectedDemo(track);
  playTrack(track);
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
    await loadFeedback(result.data.id);
  } catch (error) {
    setMsg(demoEls.uploadMsg, "err", error.message || "Demo upload failed.");
  }
});

demoEls.useCurrentTimeBtn.addEventListener("click", () => {
  const roundedTime = Math.round(getCurrentPlayerTime());
  demoEls.feedbackTimestamp.value = String(roundedTime);
  if (demoEls.feedbackTimestampLabel) {
    demoEls.feedbackTimestampLabel.textContent = formatTimestamp(roundedTime);
  }
});

demoEls.feedbackForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = getToken();
  const trackId = demoEls.feedbackTrackId.value;
  if (!token) {
    setMsg(demoEls.feedbackMsg, "err", "You need to log in before leaving feedback.");
    return;
  }
  if (!trackId) {
    setMsg(demoEls.feedbackMsg, "err", "Choose a demo first.");
    return;
  }

  const formData = new FormData(demoEls.feedbackForm);
  const result = await apiFetch(`/tracks/${trackId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      category: formData.get("category"),
      timestampSec: formData.get("timestampSec") || getCurrentPlayerTime(),
      text: formData.get("text"),
    }),
  });

  if (!result.ok || !result.response.ok) {
    setMsg(demoEls.feedbackMsg, "err", (result.data && result.data.error && result.data.error.message) || "Saving feedback failed.");
    return;
  }

  setMsg(demoEls.feedbackMsg, "ok", "Feedback posted.");
  demoEls.feedbackForm.reset();
  demoEls.feedbackTrackId.value = trackId;
  demoEls.feedbackTimestamp.value = "";
  if (demoEls.feedbackTimestampLabel) {
    demoEls.feedbackTimestampLabel.textContent = "00:00";
  }
  await loadFeedback(trackId);
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
