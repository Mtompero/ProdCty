import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProfile, sendCollabRequest, voteTrack } from "../lib/api";
import { buildMediaUrl } from "../lib/format";
import { useAuth } from "../contexts/AuthContext";
import { usePlayer } from "../contexts/PlayerContext";
import { ProfileTrackList } from "../components/ProfileTrackList";
import { Modal } from "../components/Modal";
import type { ProfilePayload, Track } from "../types";

const COLLAB_SKILLS = ["vocals", "mixing", "mastering", "guitar", "drums", "beat", "production", "songwriting", "other"];

export function PublicProfilePage() {
  const { userId = "" } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { toggleTrack } = usePlayer();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [collabOpen, setCollabOpen] = useState(false);
  const [collabTrackItem, setCollabTrackItem] = useState<Track | null>(null);
  const [collabMessage, setCollabMessage] = useState("");
  const [collabContactPreference, setCollabContactPreference] = useState<"in-app" | "email" | "instagram">("in-app");

  useEffect(() => {
    if (!userId) return;
    void loadProfile(userId);
  }, [userId]);

  async function loadProfile(targetUserId: string) {
    const result = await fetchProfile(targetUserId);
    setProfile(result.data || null);
  }

  async function handleVote(trackId: string, value: 1 | -1) {
    if (!token) {
      window.alert("You need to log in before voting.");
      return;
    }
    await voteTrack(token, trackId, value);
    await loadProfile(userId);
  }

  function openCollab(track: Track) {
    if (!token) {
      navigate("/login");
      return;
    }
    setCollabTrackItem(track);
    setCollabMessage("");
    setCollabContactPreference("in-app");
    setCollabOpen(true);
  }

  async function handleCollabRequest(formData: FormData) {
    if (!token || !collabTrackItem) {
      setCollabMessage("Choose a demo and log in first.");
      return;
    }

    const result = await sendCollabRequest(token, collabTrackItem.id, {
      message: String(formData.get("message") || ""),
      skills: formData.getAll("skills").map((item) => String(item)),
      contactPreference: String(formData.get("contactPreference") || "in-app") === "instagram"
        ? "instagram"
        : String(formData.get("contactPreference") || "in-app") === "email"
          ? "email"
          : "in-app",
      instagramHandle: String(formData.get("instagramHandle") || ""),
    });

    if (!result.ok) {
      setCollabMessage(result.errorMessage);
      return;
    }

    setCollabMessage("Collab request sent.");
    window.setTimeout(() => {
      setCollabOpen(false);
      setCollabTrackItem(null);
      setCollabMessage("");
    }, 700);
  }

  if (!profile) {
    return <main className="page-shell app-shell"><div className="empty-state">Profile unavailable.</div></main>;
  }

  return (
    <main className="page-shell app-shell">
      <section className="public-profile-layout">
        <section className="app-column app-main">
          <section className="hero compact app-hero">
            <div className="profile-hero">
              <img
                className="profile-avatar"
                src={profile.user.avatarUrl ? buildMediaUrl(profile.user.avatarUrl) : "/assets/avatar-placeholder.svg"}
                alt={`${profile.user.username} avatar`}
              />
              <div>
                <p className="eyebrow">Public profile</p>
                <h1>{profile.user.username}</h1>
                <p className="hero-copy">{profile.user.bio || "No bio yet."}</p>
                <p className="muted">
                  {profile.user.interests.length ? `Interests: ${profile.user.interests.join(" | ")}` : "No interests listed yet."}
                </p>
              </div>
            </div>
          </section>

          <section className="surface-block">
            <div className="rail-stats public-profile-stats">
              <div className="stat-card"><span>Uploads</span><strong>{profile.stats.totalUploads}</strong></div>
              <div className="stat-card"><span>Plays</span><strong>{profile.stats.totalPlays}</strong></div>
              <div className="stat-card"><span>Reviews</span><strong>{profile.stats.totalRatings}</strong></div>
            </div>
          </section>

          <section className="surface-block">
            <div className="panel-header">
              <h2>Samples</h2>
              <p className="muted">Downloadable library uploads from this user.</p>
            </div>
            <ProfileTrackList
              items={profile.samples}
              onPlay={(track) => void toggleTrack(track)}
              onVote={(trackId, value) => void handleVote(trackId, value)}
            />
          </section>

          <section className="surface-block">
            <div className="panel-header">
              <h2>Demos</h2>
              <p className="muted">Work-in-progress uploads shared for feedback only.</p>
            </div>
            <ProfileTrackList
              items={profile.demos}
              onPlay={(track) => void toggleTrack(track)}
              onVote={(trackId, value) => void handleVote(trackId, value)}
              onCollab={openCollab}
            />
          </section>
        </section>
      </section>
      <Modal
        open={collabOpen}
        onClose={() => setCollabOpen(false)}
        panelClassName="narrow-dialog-panel"
        header={
          <div className="panel-header row-between">
            <div>
              <p className="eyebrow">Collab request</p>
              <h2>{collabTrackItem?.title || "Demo"}</h2>
            </div>
            <button className="btn ghost" type="button" onClick={() => setCollabOpen(false)}>
              Close
            </button>
          </div>
        }
      >
        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCollabRequest(new FormData(event.currentTarget));
          }}
        >
          <div className="field-group">
            <span className="field-label">What can you add?</span>
            <div className="compact-chip-grid">
              {COLLAB_SKILLS.map((skill) => (
                <label key={skill} className="check-chip">
                  <input type="checkbox" name="skills" value={skill} />
                  <span>{skill}</span>
                </label>
              ))}
            </div>
          </div>
          <label>
            Message
            <textarea name="message" rows={5} required placeholder="I like the hook and could add guitar layers or help with the mix." />
          </label>
          <label>
            Contact
            <select
              name="contactPreference"
              value={collabContactPreference}
              onChange={(event) => setCollabContactPreference(event.target.value as "in-app" | "email" | "instagram")}
            >
              <option value="in-app">In-app first</option>
              <option value="email">Email allowed</option>
              <option value="instagram">Request Instagram contact after accept</option>
            </select>
          </label>
          {collabContactPreference === "instagram" ? (
            <label>
              Instagram handle
              <input name="instagramHandle" placeholder="producer.name" required />
              <span className="field-hint">Only visible to the demo owner after accepting the request.</span>
            </label>
          ) : null}
          <button className="btn primary" type="submit">
            Send request
          </button>
          {collabMessage ? <div className={`msg ${collabMessage.includes("sent") ? "ok" : "err"}`}>{collabMessage}</div> : null}
        </form>
      </Modal>
    </main>
  );
}
