import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { InterestPicker } from "../components/InterestPicker";
import { INTEREST_OPTIONS, normalizeInterestList } from "../lib/interests";

function AuthHeader({ subtitle }: { subtitle: string }) {
  return (
    <header className="site-header auth-site-header">
      <div className="brand">
        <span className="brand-mark">
          <span className="dot"></span>
        </span>
        <div>
          <div className="brand-name">
            ProdCty
          </div>
          <div className="brand-sub">{subtitle}</div>
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
  );
}

export function LoginPage() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [loginMsg, setLoginMsg] = useState("");

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
      <AuthHeader subtitle="sign in to upload, comment and rate" />
      <main className="page-shell auth-shell split-auth-shell">
        <section className="hero compact auth-hero auth-copy-block">
          <p className="eyebrow">Welcome back</p>
          <h1>Sign in to continue creating.</h1>
          <p className="hero-copy">
            Keep your sample library, demo feedback, collab inbox and moderation state connected to one account.
          </p>
        </section>

        <section className="panel auth-panel focused-auth-panel">
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
          <div className="auth-switch-line">
            <span>New to ProdCty?</span>
            <NavLink to="/register">Create an account</NavLink>
          </div>
        </section>
      </main>
    </div>
  );
}

export function RegisterPage() {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const [registerInterests, setRegisterInterests] = useState<string[]>([]);
  const [registerMsg, setRegisterMsg] = useState("");

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

    setRegisterMsg(result.ok ? "Account created. Redirecting to login..." : result.message);
    if (result.ok) {
      setRegisterInterests([]);
      setTimeout(() => navigate("/login"), 450);
    }
  }

  return (
    <div className="auth-page-shell">
      <AuthHeader subtitle="join the producer community" />
      <main className="page-shell auth-shell split-auth-shell">
        <section className="hero compact auth-hero auth-copy-block">
          <p className="eyebrow">Join ProdCty</p>
          <h1>Create your producer profile.</h1>
          <p className="hero-copy">
            Choose your core interests so the demo board can prioritize music closer to your own style.
          </p>
        </section>

        <section className="panel auth-panel focused-auth-panel register-panel">
          <div className="panel-header">
            <h2>Register</h2>
            <p className="muted">Set up your account and pick the genres you care about most.</p>
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
            <div className={`msg ${registerMsg.includes("created") || registerMsg.includes("Redirecting") ? "ok" : "err"}`}>{registerMsg}</div>
          </form>
          <div className="auth-switch-line">
            <span>Already have an account?</span>
            <NavLink to="/login">Login</NavLink>
          </div>
        </section>
      </main>
    </div>
  );
}
