import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProfile, voteTrack } from "../lib/api";
import { buildMediaUrl } from "../lib/format";
import { useAuth } from "../contexts/AuthContext";
import { usePlayer } from "../contexts/PlayerContext";
import { ProfileTrackList } from "../components/ProfileTrackList";
import type { ProfilePayload } from "../types";

export function PublicProfilePage() {
  const { userId = "" } = useParams();
  const { token } = useAuth();
  const { toggleTrack } = usePlayer();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);

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
            />
          </section>
        </section>
      </section>
    </main>
  );
}
