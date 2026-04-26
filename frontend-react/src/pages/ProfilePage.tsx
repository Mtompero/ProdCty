import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteTrack, fetchProfile, updateMe, uploadAvatar, voteTrack } from "../lib/api";
import { buildMediaUrl } from "../lib/format";
import { INTEREST_OPTIONS } from "../lib/interests";
import { useAuth } from "../contexts/AuthContext";
import { usePlayer } from "../contexts/PlayerContext";
import { InterestPicker } from "../components/InterestPicker";
import { ProfileTrackList } from "../components/ProfileTrackList";
import type { ProfilePayload } from "../types";

export function ProfilePage() {
  const { token, user, setUser, refreshMe } = useAuth();
  const { toggleTrack } = usePlayer();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    void loadProfile(user.id);
  }, [user?.id]);

  async function loadProfile(userId: string) {
    const result = await fetchProfile(userId);
    if (!result.data) return;
    setProfile(result.data);
    setBio(result.data.user.bio || "");
    setInterests(result.data.user.interests || []);
  }

  async function handleSave() {
    if (!token) return;
    const result = await updateMe(token, { bio, interests });
    if (!result.ok || !result.data) {
      setMessage(result.errorMessage);
      return;
    }
    setUser(result.data.user);
    setMessage("Profile saved.");
    await loadProfile(result.data.user.id);
  }

  async function handleAvatarUpload() {
    if (!token || !avatarFile) return;
    const result = await uploadAvatar(token, avatarFile);
    if (!result.ok || !result.data) {
      setMessage(result.errorMessage);
      return;
    }
    setUser(result.data.user);
    await refreshMe();
    await loadProfile(result.data.user.id);
    setMessage("Avatar updated.");
  }

  async function handleDelete(trackId: string) {
    if (!token || !user) return;
    if (!window.confirm("Delete this upload? This cannot be undone.")) return;
    await deleteTrack(token, trackId);
    await loadProfile(user.id);
  }

  async function handleVote(trackId: string, value: 1 | -1) {
    if (!token || !user) {
      window.alert("You need to log in before voting.");
      return;
    }
    await voteTrack(token, trackId, value);
    await loadProfile(user.id);
  }

  if (!profile) {
    return <main className="page-shell app-shell"><div className="empty-state">Loading profile...</div></main>;
  }

  return (
    <main className="page-shell app-shell">
      <section className="app-layout">
        <aside className="app-column app-sidebar">
          <section className="surface-block">
            <div className="panel-header">
              <h2>Edit profile</h2>
              <p className="muted">Update your avatar and a short bio.</p>
            </div>
            <div className="stack-form">
              <label>
                Profile image
                <input type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />
              </label>
              <button className="btn primary" type="button" onClick={() => void handleAvatarUpload()}>
                Upload avatar
              </button>
              <label>
                Bio
                <textarea value={bio} rows={5} onChange={(event) => setBio(event.target.value)} placeholder="Tell people what you make." />
              </label>
              <div className="field-group">
                <span className="field-label">Interests</span>
                <InterestPicker options={INTEREST_OPTIONS} selected={interests} onChange={setInterests} />
              </div>
              <button className="btn" type="button" onClick={() => void handleSave()}>
                Save profile
              </button>
              {message ? <div className={`msg ${message.includes("saved") || message.includes("updated") ? "ok" : "err"}`}>{message}</div> : null}
            </div>
          </section>
        </aside>

        <section className="app-column app-main">
          <section className="hero compact app-hero">
            <div className="profile-hero">
              <img
                className="profile-avatar"
                src={profile.user.avatarUrl ? buildMediaUrl(profile.user.avatarUrl) : "/assets/avatar-placeholder.svg"}
                alt={`${profile.user.username} avatar`}
              />
              <div>
                <p className="eyebrow">Artist profile</p>
                <h1>{profile.user.username}</h1>
                <p className="hero-copy">{profile.user.bio || "No bio yet."}</p>
                <p className="muted">
                  {profile.user.interests.length ? `Interests: ${profile.user.interests.join(" | ")}` : "No interests listed yet."}
                </p>
              </div>
            </div>
          </section>

          <section className="surface-block">
            <div className="rail-stats">
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
              canDelete
              onPlay={(track) => void toggleTrack(track)}
              onDelete={(trackId) => void handleDelete(trackId)}
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
              canDelete
              onPlay={(track) => void toggleTrack(track)}
              onDelete={(trackId) => void handleDelete(trackId)}
              onVote={(trackId, value) => void handleVote(trackId, value)}
            />
          </section>
        </section>
      </section>
    </main>
  );
}
