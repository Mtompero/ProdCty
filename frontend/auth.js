const API = "http://localhost:3000";

const registerForm = document.getElementById("registerForm");
const registerMsg = document.getElementById("registerMsg");

const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");

function setMsg(el, kind, text) {
  el.className = "msg" + (kind ? " " + kind : "");
  el.textContent = text || "";
}

function setToken(token) {
  if (token) localStorage.setItem("prodcty_token", token);
  else localStorage.removeItem("prodcty_token");
}

function normalizeInterests(v) {
  const s = String(v || "").trim();
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(registerMsg, "", "Registering...");

  const fd = new FormData(registerForm);
  const payload = {
    username: fd.get("username"),
    email: fd.get("email"),
    password: fd.get("password"),
    interests: normalizeInterests(fd.get("interests")),
  };

  const r = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await r.json().catch(() => null);

  if (!r.ok) {
    setMsg(registerMsg, "err", (data && data.error && data.error.message) || "Register failed");
    return;
  }

  setMsg(registerMsg, "ok", "Account created. You can login now.");
  registerForm.reset();
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(loginMsg, "", "Logging in...");

  const fd = new FormData(loginForm);
  const payload = {
    email: fd.get("email"),
    password: fd.get("password"),
  };

  const r = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await r.json().catch(() => null);

  if (!r.ok) {
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
