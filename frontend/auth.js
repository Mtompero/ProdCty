const API = "http://localhost:3000";

const registerForm = document.getElementById("registerForm");
const registerMsg = document.getElementById("registerMsg");
const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");
const apiStatus = document.getElementById("apiStatus");

function setMsg(el, kind, text) {
  if (!el) return;
  el.className = "msg" + (kind ? " " + kind : "");
  el.textContent = text || "";
}

function setToken(token) {
  if (token) localStorage.setItem("prodcty_token", token);
  else localStorage.removeItem("prodcty_token");
}

function normalizeInterests(value) {
  const text = String(value || "").trim();
  if (!text) return [];

  return text
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

async function apiFetch(path, options = {}) {
  try {
    const response = await fetch(`${API}${path}`, options);
    const data = await response.json().catch(() => null);
    return { ok: true, response, data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

async function checkApiHealth() {
  const result = await apiFetch("/health");
  if (!result.ok) {
    setMsg(apiStatus, "err", "Backend offline on http://localhost:3000");
    return;
  }

  setMsg(apiStatus, "ok", "Backend connected");
}

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMsg(registerMsg, "", "Registering...");

  const formData = new FormData(registerForm);
  const payload = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    interests: normalizeInterests(formData.get("interests")),
  };

  const result = await apiFetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    setMsg(registerMsg, "err", "Backend is not reachable. Start the API server first.");
    setMsg(apiStatus, "err", "Backend offline on http://localhost:3000");
    return;
  }

  const { response, data } = result;
  if (!response.ok) {
    setMsg(registerMsg, "err", (data && data.error && data.error.message) || "Register failed");
    return;
  }

  setMsg(registerMsg, "ok", "Account created. You can login now.");
  registerForm.reset();
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMsg(loginMsg, "", "Logging in...");

  const formData = new FormData(loginForm);
  const payload = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const result = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    setMsg(loginMsg, "err", "Backend is not reachable. Start the API server first.");
    setMsg(apiStatus, "err", "Backend offline on http://localhost:3000");
    return;
  }

  const { response, data } = result;
  if (!response.ok) {
    setMsg(loginMsg, "err", (data && data.error && data.error.message) || "Login failed");
    return;
  }

  const token = data && data.token ? String(data.token) : "";
  if (!token) {
    setMsg(loginMsg, "err", "No token received.");
    return;
  }

  setToken(token);

  const username = data && data.user && data.user.username ? String(data.user.username) : "";
  const userId = data && data.user && data.user.id ? String(data.user.id) : "";

  if (username) localStorage.setItem("prodcty_username", username);
  else localStorage.removeItem("prodcty_username");

  if (userId) localStorage.setItem("prodcty_userId", userId);
  else localStorage.removeItem("prodcty_userId");

  setMsg(loginMsg, "ok", "Logged in. Redirecting...");
  setTimeout(() => {
    window.location.href = "./index.html";
  }, 350);
});

checkApiHealth();
