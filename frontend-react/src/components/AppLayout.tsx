import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { usePlayer } from "../contexts/PlayerContext";
import { buildMediaUrl, formatDate, formatDuration, formatFileSize, formatTimestamp } from "../lib/format";
import { fetchCollabRequests, searchUsers, updateCollabRequest } from "../lib/api";
import type { CollabRequest, User } from "../types";

function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      const result = await searchUsers(query);
      setResults((result.data || []).filter((item) => item.role !== "admin"));
      setOpen(true);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="global-user-search">
      <input
        id="globalUserSearchInput"
        placeholder="Search creators"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setOpen(results.length > 0)}
      />
      <div className={`global-user-results ${open ? "open" : ""}`}>
        {!results.length ? (
          query.trim().length >= 1 ? <div className="global-user-empty">No creators found.</div> : null
        ) : (
          results.map((user) => (
            <NavLink
              key={user.id}
              className="global-user-result"
              to={`/profile/${user.id}`}
              onClick={() => setOpen(false)}
            >
              <img
                className="mini-avatar"
                src={user.avatarUrl ? buildMediaUrl(user.avatarUrl) : "/assets/avatar-placeholder.svg"}
                alt={`${user.username} avatar`}
              />
              <span>
                <strong>{user.username}</strong>
                <small>{(user.interests || []).slice(0, 2).join(" | ") || "View profile"}</small>
              </span>
            </NavLink>
          ))
        )}
      </div>
    </div>
  );
}

function CollabInbox() {
  const { token, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CollabRequest[]>([]);
  const [message, setMessage] = useState("");

  async function loadInbox() {
    if (!token) return;
    const result = await fetchCollabRequests(token);
    if (result.ok && result.data) {
      setItems(result.data.items);
    }
  }

  useEffect(() => {
    if (!token) {
      setItems([]);
      return;
    }
    void loadInbox();
    const timer = window.setInterval(() => void loadInbox(), 30000);
    return () => window.clearInterval(timer);
  }, [token]);

  async function decide(requestId: string, status: "accepted" | "declined") {
    if (!token) return;
    const result = await updateCollabRequest(token, requestId, status);
    setMessage(result.ok ? `Request ${status}.` : result.errorMessage);
    await loadInbox();
  }

  if (!user || !token) return null;

  const pendingIncoming = items.filter((item) => item.direction === "incoming" && item.status === "pending");
  const visibleItems = [...items].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
  });

  return (
    <div className="collab-inbox">
      <button
        className={`btn ghost inbox-trigger ${pendingIncoming.length ? "has-new" : ""}`}
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          setMessage("");
          void loadInbox();
        }}
      >
        Inbox
        {pendingIncoming.length ? <span>{pendingIncoming.length}</span> : null}
      </button>
      <div className={`collab-inbox-panel ${open ? "open" : ""}`}>
        <div className="panel-header row-between">
          <div>
            <h2>Collab inbox</h2>
            <p className="muted">Incoming and sent requests.</p>
          </div>
          <button className="btn ghost small" type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
        <div className="collab-inbox-list">
          {visibleItems.length ? (
            visibleItems.map((item) => (
              <article key={item.id} className={`collab-inbox-item ${item.status}`}>
                <div className="collab-inbox-top">
                  <strong>{item.trackTitle}</strong>
                  <span>{item.status}</span>
                </div>
                <p className="muted">
                  {item.direction === "incoming"
                    ? `${item.requesterUsername} wants to collaborate`
                    : `Sent to ${item.trackOwnerUsername}`}
                </p>
                <p>{item.message}</p>
                <div className="collab-skills-line">{item.skills.length ? item.skills.join(" | ") : "general collab"}</div>
                <div className="collab-contact-line">
                  {item.contactPreference === "instagram" ? (
                    item.instagramVisible && item.instagramHandle ? (
                      <a href={`https://instagram.com/${item.instagramHandle.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                        Instagram: @{item.instagramHandle.replace(/^@/, "")}
                      </a>
                    ) : (
                      "Instagram will unlock after acceptance."
                    )
                  ) : item.contactPreference === "email" ? (
                    "Email allowed after acceptance."
                  ) : (
                    "In-app first."
                  )}
                </div>
                <small className="muted">{formatDate(item.createdAt)}</small>
                {item.direction === "incoming" && item.status === "pending" ? (
                  <div className="card-actions">
                    <button className="btn primary small" type="button" onClick={() => void decide(item.id, "accepted")}>
                      Accept
                    </button>
                    <button className="btn ghost small" type="button" onClick={() => void decide(item.id, "declined")}>
                      Decline
                    </button>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="empty-state">No collab requests yet.</div>
          )}
        </div>
        {message ? <div className={`msg ${message.includes("accepted") || message.includes("declined") ? "ok" : "err"}`}>{message}</div> : null}
      </div>
    </div>
  );
}

function BottomPlayer() {
  const { currentTrack, audioRef, currentTime, duration, updateProgress, setIsPlaying } = usePlayer();
  const info = useMemo(() => {
    if (!currentTrack) return "Pick a sample or demo to start playback.";
    return `${currentTrack.username} | ${currentTrack.genre} | ${currentTrack.musicalKey || "-"} | ${currentTrack.energyLevel} energy | ${formatFileSize(currentTrack.fileSize)}`;
  }, [currentTrack]);

  return (
    <div
      className={`bottom-player ${currentTrack?.aura?.gradient ? "has-aura" : ""}`}
      style={
        currentTrack?.aura?.gradient
          ? ({
              ["--player-aura-gradient" as string]: currentTrack.aura.gradient,
              ["--player-aura-primary" as string]: currentTrack.aura.primaryColor,
              ["--player-aura-secondary" as string]: currentTrack.aura.secondaryColor,
              ["--player-aura-accent" as string]: currentTrack.aura.accentColor,
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="bottom-player-meta">
        <span className="eyebrow">Now playing</span>
        <strong>{currentTrack?.title || "No track selected yet"}</strong>
        <span className="muted">{info}</span>
      </div>
      <div className="bottom-player-audio-shell">
        <div className="bottom-player-time">
          {formatTimestamp(currentTime)} / {formatDuration(duration || currentTrack?.durationSec || 0)}
        </div>
        <audio
          ref={audioRef}
          controls
          preload="none"
          onTimeUpdate={(event) => updateProgress(event.currentTarget.currentTime, event.currentTarget.duration)}
          onLoadedMetadata={(event) => updateProgress(event.currentTarget.currentTime, event.currentTarget.duration)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      </div>
    </div>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.className = "";
  }, [location.pathname]);

  return (
    <div className="app-root">
      <header className="site-header">
        <div className="brand">
          <span className="dot"></span>
          <div>
            <div className="brand-name">ProdCty</div>
            <div className="brand-sub">audio community for producers</div>
          </div>
        </div>
        <nav className="main-nav">
          <NavLink className="nav-link" to="/library">
            Library
          </NavLink>
          <NavLink className="nav-link" to="/demos">
            Demos
          </NavLink>
          {user?.role === "admin" ? (
            <NavLink className="nav-link" to="/admin">
              Admin
            </NavLink>
          ) : null}
        </nav>
        <div className="header-actions">
          <HeaderSearch />
          {!user ? (
            <button className="btn ghost" onClick={() => navigate("/auth")}>
              Login
            </button>
          ) : (
            <>
              <CollabInbox />
              <NavLink className="profile-link" to="/profile" aria-label="Open profile">
                <img
                  className="header-avatar"
                  src={user.avatarUrl ? buildMediaUrl(user.avatarUrl) : "/assets/avatar-placeholder.svg"}
                  alt="Profile avatar"
                />
              </NavLink>
              <button className="btn small" onClick={logout}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>
      {user?.moderationStatus === "warned" ? (
        <div className="moderation-banner" role="alert">
          <strong>Account warning</strong>
          <span>
            {user.moderationReason || "Your account has received a moderation warning."} Warning {user.warningCount || 1}/2. A second warning can result in a ban.
          </span>
        </div>
      ) : null}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          className="route-transition-shell"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <BottomPlayer />
    </div>
  );
}
