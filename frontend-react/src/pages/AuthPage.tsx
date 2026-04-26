import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { InterestPicker } from "../components/InterestPicker";
import { INTEREST_OPTIONS, normalizeInterestList } from "../lib/interests";

export function AuthPage() {
  const { loginUser, registerUser } = useAuth();
  const navigate = useNavigate();
  const [registerInterests, setRegisterInterests] = useState<string[]>([]);
  const [registerMsg, setRegisterMsg] = useState("");
  const [loginMsg, setLoginMsg] = useState("");

  async function handleRegister(formData: FormData) {
    const password = String(formData.get("password") || "");
    if (password.length < 8) {
      setRegisterMsg("Password must be at least 8 characters.");
      return;
    }

    const result = await registerUser({
      username: String(formData.get("username") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      password,
      interests: normalizeInterestList(registerInterests),
    });

    setRegisterMsg(result.ok ? "Account created. You can login now." : result.message);
    if (result.ok) {
      setRegisterInterests([]);
    }
  }

  async function handleLogin(formData: FormData) {
    const result = await loginUser({
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
    });

    if (!result.ok) {
      setLoginMsg(result.message);
      return;
    }

    setLoginMsg("Logged in. Redirecting...");
    setTimeout(() => navigate("/library"), 250);
  }

  return (
    <div className="auth-page-shell">
      <header className="site-header">
        <div className="brand">
          <span className="dot"></span>
          <div>
            <div className="brand-name">ProdCty</div>
            <div className="brand-sub">sign in to upload, comment and rate</div>
          </div>
        </div>
        <nav className="main-nav">
          <NavLink className="nav-link" to="/library">
            Library
          </NavLink>
          <NavLink className="nav-link" to="/demos">
            Demos
          </NavLink>
        </nav>
      </header>

      <main className="page-shell auth-shell">
        <section className="hero compact auth-hero">
          <div>
            <p className="eyebrow">Authentication</p>
            <h1>Create an account or sign in.</h1>
            <p className="hero-copy">
              Logged-in users can upload audio, give demo feedback and connect with other producers.
            </p>
          </div>
        </section>

        <section className="auth-grid">
          <section className="panel auth-panel">
            <div className="panel-header">
              <h2>Register</h2>
            </div>
            <form
              className="stack-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleRegister(new FormData(event.currentTarget));
              }}
            >
              <label>
                Username
                <input name="username" required />
              </label>
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                Password
                <input name="password" type="password" minLength={8} required />
              </label>
              <div className="field-group">
                <span className="field-label">Interests</span>
                <InterestPicker
                  options={INTEREST_OPTIONS}
                  selected={registerInterests}
                  onChange={setRegisterInterests}
                />
              </div>
              <button className="btn primary" type="submit">
                Create account
              </button>
              <div className={`msg ${registerMsg.includes("created") ? "ok" : "err"}`}>{registerMsg}</div>
            </form>
          </section>

          <section className="panel auth-panel">
            <div className="panel-header">
              <h2>Login</h2>
              <p className="muted">After a successful login you will be sent back into the app.</p>
            </div>
            <form
              className="stack-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleLogin(new FormData(event.currentTarget));
              }}
            >
              <label>
                Email
                <input name="email" type="email" required />
              </label>
              <label>
                Password
                <input name="password" type="password" minLength={8} required />
              </label>
              <button className="btn primary" type="submit">
                Login
              </button>
              <div className={`msg ${loginMsg.includes("Logged in") ? "ok" : "err"}`}>{loginMsg}</div>
            </form>
          </section>
        </section>
      </main>
    </div>
  );
}
