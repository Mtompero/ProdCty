const API = "http://localhost:3000";

const loginStatusEl = document.getElementById("loginStatus");
const logoutBtn = document.getElementById("logoutBtn");

const statusEl = document.getElementById("status");
const feedEl = document.getElementById("feed");
const feedEmptyEl = document.getElementById("feedEmpty");

const refreshBtn = document.getElementById("refreshBtn");

const createForm = document.getElementById("createForm");
const createMsg = document.getElementById("createMsg");

const commentForm = document.getElementById("commentForm");
const commentMsg = document.getElementById("commentMsg");
const commentList = document.getElementById("commentList");
const commentTrackId = document.getElementById("commentTrackId");

const authMsgEl = document.getElementById("authMsg");

function getToken() {
  return localStorage.getItem("prodcty_token") || "";
}

function setToken(token) {
  if (token) localStorage.setItem("prodcty_token", token);
  else localStorage.removeItem("prodcty_token");
  updateAuthUI();
}

function getUsername() {
  return localStorage.getItem("prodcty_username") || "";
}

function setUsername(name) {
  if (name) localStorage.setItem("prodcty_username", name);
  else localStorage.removeItem("prodcty_username");
  updateAuthUI();
}
function updateLoginHeader() {
  const username = localStorage.getItem("prodcty_username") || "";
  if (loginStatusEl) {
    loginStatusEl.textContent = username ? `Logged in as ${username}` : "Not logged in";
  }
}




function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtDate(iso) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function setMsg(el, kind, text) {
  el.className = "msg" + (kind ? " " + kind : "");
  el.textContent = text || "";
}

function updateAuthUI() {
  const token = getToken();
  const loggedIn = Boolean(token);
  const username = getUsername();

  if (authMsgEl) {
    if (loggedIn) setMsg(authMsgEl, "ok", username ? `Logged in as ${username}` : "Logged in");
    else setMsg(authMsgEl, "err", "Not logged in");
  }

  const canComment = loggedIn && Boolean(commentTrackId.value);
  const submitBtn = commentForm ? commentForm.querySelector('button[type="submit"]') : null;
  if (submitBtn) submitBtn.disabled = !canComment;

  if (!loggedIn) {
    setMsg(commentMsg, "err", "Login required to comment.");
  } else if (!commentTrackId.value) {
    setMsg(commentMsg, "", "Select a track from the feed to comment.");
  } else {
    setMsg(commentMsg, "", "");
  }
  updateLoginHeader();
}


async function apiHealth() {
  try {
    const r = await fetch(`${API}/health`);
    const j = await r.json();
    statusEl.textContent = j.ok ? "API: online" : "API: problem";
  } catch {
    statusEl.textContent = "API: offline";
  }
}

async function loadFeed() {
  feedEl.innerHTML = "";
  feedEmptyEl.style.display = "none";

  const r = await fetch(`${API}/feed`);
  const items = await r.json();

  if (!items.length) {
    feedEmptyEl.style.display = "block";
    return;
  }

  const selectedId = commentTrackId.value;

  for (const t of items) {
    const card = document.createElement("div");
    card.className = "card";
    if (selectedId && t.id === selectedId) {
      card.style.borderColor = "rgba(255,45,45,.55)";
      card.style.boxShadow = "0 0 0 4px rgba(255,45,45,.10)";
    }

    const metaParts = [];
    if (t.userId) metaParts.push(`user=${escapeHtml(t.userId)}`);
    const dateLabel = fmtDate(t.createdAt);
    if (dateLabel) metaParts.push(dateLabel);

    card.innerHTML = `
      <div class="top">
        <div>
          <div class="title">${escapeHtml(t.title)}</div>
          <div class="meta">${metaParts.join(" • ")}</div>
        </div>
      </div>
      <div class="actions">
        <button class="btn small" data-action="select" data-id="${escapeHtml(t.id)}">Select</button>
        <button class="btn small" data-action="view" data-id="${escapeHtml(t.id)}">Comments</button>
      </div>
    `;

    feedEl.appendChild(card);
  }
}

async function loadComments(trackId) {
  commentList.textContent = "Loading...";
  const r = await fetch(`${API}/tracks/${trackId}/comments`);
  const data = await r.json();

  if (Array.isArray(data) && data.length === 0) {
    commentList.textContent = "No comments yet.";
    return;
  }

  if (!Array.isArray(data)) {
    commentList.textContent = `Error: ${data && data.error && data.error.message ? data.error.message : "unknown"}`;
    return;
  }

  commentList.innerHTML = data
    .map((c) => {
      const who = escapeHtml(c.author || "anon");
      const txt = escapeHtml(c.text || "");
      const when = fmtDate(c.createdAt);
      const whenPart = when ? ` <span class="muted">(${escapeHtml(when)})</span>` : "";
      return `• <span class="muted">${who}</span>: ${txt}${whenPart}`;
    })
    .join("<br/>");
}

feedEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.getAttribute("data-action");
  const id = btn.getAttribute("data-id");

  if (!id) return;

  if (action === "select") {
    commentTrackId.value = id;

    const titleEl = btn.closest(".card")?.querySelector(".title");
    const title = titleEl ? titleEl.textContent : "Selected";
    document.getElementById("selectedTrackTitle").textContent = title;

    setMsg(commentMsg, "ok", "Track selected.");
    await loadFeed();
    updateAuthUI();
  }

  if (action === "view") {
    commentTrackId.value = id;

    const titleEl = btn.closest(".card")?.querySelector(".title");
    const title = titleEl ? titleEl.textContent : "Selected";
    document.getElementById("selectedTrackTitle").textContent = title;

    await loadComments(id);
    await loadFeed();
    updateAuthUI();
  }
});

createForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(createMsg, "", "Creating...");

  const fd = new FormData(createForm);
  const payload = {
    userId: fd.get("userId"),
    title: fd.get("title"),
    genre: fd.get("genre"),
  };

const token = getToken();
if (!token) {
  setMsg(createMsg, "err", "Login required to create a track.");
  return;
}

    const r = await fetch(`${API}/tracks`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });


  const data = await r.json();

  if (!r.ok) {
    setMsg(createMsg, "err", (data && data.error && data.error.message) || "Create failed");
    return;
  }

  setMsg(createMsg, "ok", "Created.");
  createForm.reset();
  createForm.querySelector('input[name="userId"]').value = "1";

  await loadFeed();
});

commentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = getToken();
  if (!token) {
    setMsg(commentMsg, "err", "Login required to comment.");
    updateAuthUI();
    return;
  }

  setMsg(commentMsg, "", "Posting...");

  const fd = new FormData(commentForm);
  const trackId = fd.get("trackId");
  const text = fd.get("text");

  const payload = { text };

  const r = await fetch(`${API}/tracks/${trackId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await r.json();

  if (!r.ok) {
    setMsg(commentMsg, "err", (data && data.error && data.error.message) || "Comment failed");
    return;
  }

  setMsg(commentMsg, "ok", "Comment added.");
  commentForm.reset();
  commentForm.querySelector('input[name="trackId"]').value = trackId;

  await loadComments(trackId);
});

refreshBtn.addEventListener("click", loadFeed);
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("prodcty_token");
        localStorage.removeItem("prodcty_username");
        localStorage.removeItem("prodcty_userId");
        window.location.href = "./auth.html";
  });
}


window.addEventListener("storage", updateAuthUI);

apiHealth();
loadFeed();
updateAuthUI();
updateLoginHeader();
setInterval(apiHealth, 2500);
