const socialEls = {
  feed: document.getElementById("socialFeed"),
  empty: document.getElementById("socialEmpty"),
  refreshBtn: document.getElementById("refreshBtn"),
  selectedTrackTitle: document.getElementById("selectedTrackTitle"),
  selectedTrackMeta: document.getElementById("selectedTrackMeta"),
  playSelectedBtn: document.getElementById("playSelectedBtn"),
  commentForm: document.getElementById("commentForm"),
  commentTrackId: document.getElementById("commentTrackId"),
  commentMsg: document.getElementById("commentMsg"),
  commentList: document.getElementById("commentList"),
};

let selectedTrack = null;

function socialCard(track) {
  return `
    <article class="feed-card">
      <div class="row-between">
        <div>
          <h3>${escapeHtml(track.title)}</h3>
          <div class="meta-line">${renderUserLink(track.userId, track.username)} | ${escapeHtml(track.genre || "unknown")} | ${escapeHtml(fmtDate(track.createdAt))}</div>
        </div>
        <div class="rating-badge">Community</div>
      </div>
      <p class="muted">${escapeHtml(track.description || "No description yet.")}</p>
      <div class="card-actions">
        <button class="btn primary" data-select="${escapeHtml(track.id)}">Select</button>
        <button class="btn" data-play="${escapeHtml(track.id)}">Play</button>
      </div>
    </article>
  `;
}

async function loadFeed() {
  const result = await apiFetch("/tracks?kind=sample");
  if (!result.ok) {
    socialEls.feed.innerHTML = "";
    socialEls.empty.style.display = "block";
    socialEls.empty.textContent = "The backend is currently unreachable.";
    return [];
  }

  const items = Array.isArray(result.data) ? result.data : [];
  socialEls.feed.innerHTML = items.map(socialCard).join("");
  socialEls.empty.style.display = items.length ? "none" : "block";
  return items;
}

function setSelectedTrack(track) {
  selectedTrack = track;
  socialEls.commentTrackId.value = track ? track.id : "";
  socialEls.selectedTrackTitle.textContent = track ? track.title : "Nothing selected";
  socialEls.selectedTrackMeta.textContent = track
    ? `${track.username || "unknown"} | ${track.genre || "unknown"} | ${formatDuration(track.durationSec)}`
    : "Choose a track from the feed.";
}

async function loadComments(trackId) {
  const result = await apiFetch(`/tracks/${trackId}/comments`);
  if (!result.ok || !result.response.ok) {
    socialEls.commentList.textContent = "Failed to load comments.";
    return;
  }

  const items = Array.isArray(result.data) ? result.data : [];
  if (!items.length) {
    socialEls.commentList.textContent = "No comments on this track yet.";
    return;
  }

  socialEls.commentList.innerHTML = items
    .map((comment) => `
      <div class="comment-row">
        <strong>${escapeHtml(comment.author || "anonymous")}</strong>
        <span>${escapeHtml(comment.text || "")}</span>
        <span class="muted">${escapeHtml(fmtDate(comment.createdAt))}</span>
      </div>
    `)
    .join("");
}

socialEls.feed.addEventListener("click", async (event) => {
  const selectBtn = event.target.closest("[data-select]");
  const playBtn = event.target.closest("[data-play]");
  const trackId = selectBtn ? selectBtn.dataset.select : playBtn ? playBtn.dataset.play : "";
  if (!trackId) return;

  const result = await apiFetch(`/tracks/${trackId}`);
  if (!result.ok || !result.response.ok) return;

  if (selectBtn) {
    setSelectedTrack(result.data);
    await loadComments(trackId);
  }
  if (playBtn) {
    playTrack(result.data);
  }
});

socialEls.playSelectedBtn.addEventListener("click", () => {
  if (selectedTrack) {
    playTrack(selectedTrack);
  }
});

socialEls.commentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = getToken();
  const trackId = socialEls.commentTrackId.value;
  if (!token) {
    setMsg(socialEls.commentMsg, "err", "You need to log in before commenting.");
    return;
  }
  if (!trackId) {
    setMsg(socialEls.commentMsg, "err", "Choose a track first.");
    return;
  }

  const formData = new FormData(socialEls.commentForm);
  const result = await apiFetch(`/tracks/${trackId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text: formData.get("text") }),
  });

  if (!result.ok || !result.response.ok) {
    setMsg(socialEls.commentMsg, "err", (result.data && result.data.error && result.data.error.message) || "Comment failed.");
    return;
  }

  setMsg(socialEls.commentMsg, "ok", "Comment posted.");
  socialEls.commentForm.reset();
  socialEls.commentTrackId.value = trackId;
  await loadComments(trackId);
});

socialEls.refreshBtn.addEventListener("click", loadFeed);

initShell();
loadFeed();
