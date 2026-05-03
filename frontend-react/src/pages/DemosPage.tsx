import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteOwnComment, fetchComments, fetchDemos, fetchForYou, fetchRatings, fetchTrack, reportComment, reportTrack, saveComment, saveRating, sendCollabRequest, uploadTrack, voteTrack } from "../lib/api";
import { buildMediaUrl, formatDate, formatDuration } from "../lib/format";
import { AUDIO_DURATION_LIMITS_SEC, buildTrackUploadFormData, validateAudioDuration } from "../lib/upload";
import { INTEREST_OPTIONS, formatInterestLabel } from "../lib/interests";
import { useAuth } from "../contexts/AuthContext";
import { usePlayer } from "../contexts/PlayerContext";
import type { Comment, Rating, Track } from "../types";
import { InterestPicker } from "../components/InterestPicker";
import { Modal } from "../components/Modal";
import { TrackVoteControls } from "../components/TrackVoteControls";
import { WaveformPreview } from "../components/WaveformPreview";

type FeedbackItem =
  | ({ type: "rating"; date: string } & Rating)
  | ({ type: "comment"; date: string } & Comment);

type ReplyTarget = {
  type: "comment" | "rating";
  id: string;
  author: string;
};

function feedbackItems(ratings: Rating[], comments: Comment[]) {
  const combined: FeedbackItem[] = [
    ...ratings.map((item) => ({ ...item, type: "rating" as const, date: item.updatedAt })),
    ...comments
      .filter((item) => !item.parentId && !item.parentRatingId)
      .map((item) => ({ ...item, type: "comment" as const, date: item.createdAt })),
  ];

  return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const AURA_PREVIEW_COLORS: Record<string, [string, string, string]> = {
  rock: ["#ff4d2d", "#f0b429", "#48f2d4"],
  lofi: ["#33d6c8", "#e8895d", "#a6f56f"],
  metal: ["#ff1f3d", "#8f1dff", "#f4f4f5"],
  "hip hop": ["#c84dff", "#ffb01f", "#2de2ff"],
  trap: ["#7a35ff", "#ff2fc3", "#35e7ff"],
  house: ["#21e6a8", "#2674ff", "#ffe04d"],
  techno: ["#25d9ff", "#4c3bff", "#ff2fa8"],
  ambient: ["#5871ff", "#a95dff", "#d7f56f"],
  jazz: ["#ffad33", "#8e45ff", "#ffe066"],
  pop: ["#ff4f9a", "#7c5cff", "#45e6ff"],
  indie: ["#9ce83a", "#ff7a3d", "#6be8ff"],
  "r&b": ["#9a68ff", "#d8a85f", "#7ff06b"],
  soul: ["#ff8438", "#ff4fb8", "#f5d76e"],
  funk: ["#ffd338", "#65e642", "#ff6b35"],
  reggae: ["#34d058", "#ffd43b", "#ff4d3d"],
  "drum and bass": ["#21f0d1", "#45a3ff", "#f7ff3c"],
  cinematic: ["#4f7cff", "#b47cff", "#ffd166"],
  classical: ["#7868ff", "#e0c3ff", "#f5d76e"],
  folk: ["#8ee53f", "#d9a441", "#4ee0bc"],
  experimental: ["#ff43d1", "#44ffe1", "#b45cff"],
};

const AURA_ANALYSIS_DELAY_MS = 1250;
const COLLAB_SKILLS = ["vocals", "mixing", "mastering", "guitar", "drums", "beat", "production", "songwriting", "other"];

function previewAuraFromGenres(genres: string[]) {
  const genre = genres[0] || "rock";
  const colors = AURA_PREVIEW_COLORS[genre] || ["#ff2d2d", "#b59f21", "#2dd4bf"];
  return {
    genre,
    primaryColor: colors[0],
    secondaryColor: colors[1],
    accentColor: colors[2],
    gradient: `linear-gradient(135deg, ${colors[0]}, ${colors[1]} 58%, ${colors[2]})`,
  };
}

export function DemosPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, toggleTrack } = usePlayer();
  const [mode, setMode] = useState<"for-you" | "top">("for-you");
  const [demos, setDemos] = useState<Track[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTrackItem, setReportTrackItem] = useState<Track | null>(null);
  const [collabOpen, setCollabOpen] = useState(false);
  const [collabTrackItem, setCollabTrackItem] = useState<Track | null>(null);
  const [collabMessage, setCollabMessage] = useState("");
  const [collabContactPreference, setCollabContactPreference] = useState<"in-app" | "email" | "instagram">("in-app");
  const [commentReportOpen, setCommentReportOpen] = useState(false);
  const [reportCommentItem, setReportCommentItem] = useState<Comment | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [uploadAuraStatus, setUploadAuraStatus] = useState<"idle" | "analyzing" | "revealed">("idle");
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);

  const timeline = useMemo(() => feedbackItems(ratings, comments), [ratings, comments]);
  const uploadAuraPreview = useMemo(() => previewAuraFromGenres(selectedGenres), [selectedGenres]);

  function closeUploadModal() {
    setUploadOpen(false);
    setUploadSubmitting(false);
    setUploadAuraStatus("idle");
  }

  function openUploadDemo() {
    if (!token) {
      navigate("/login");
      return;
    }
    setUploadOpen(true);
  }

  useEffect(() => {
    function handleHeaderUpload(event: Event) {
      const detail = (event as CustomEvent<{ kind?: string }>).detail;
      if (detail?.kind === "demo") {
        openUploadDemo();
      }
    }

    window.addEventListener("prodcty:open-upload", handleHeaderUpload);
    return () => window.removeEventListener("prodcty:open-upload", handleHeaderUpload);
  }, [token]);

  async function loadDemos() {
    const result = mode === "top" ? await fetchDemos("upvotes") : await fetchForYou(user?.interests || []);
    setDemos(result.data?.items || []);
  }

  useEffect(() => {
    void loadDemos();
  }, [mode, user?.interests]);

  async function openFeedback(trackId: string) {
    const [trackResult, ratingsResult, commentsResult] = await Promise.all([
      fetchTrack(trackId),
      fetchRatings(trackId),
      fetchComments(trackId),
    ]);
    if (!trackResult.data) return;
    setSelectedTrack(trackResult.data);
    setRatings(ratingsResult.data?.items || []);
    setComments(commentsResult.data || []);
    setFeedbackOpen(true);
  }

  async function handleVote(trackId: string, value: 1 | -1) {
    if (!token) {
      window.alert("You need to log in before voting.");
      return;
    }
    await voteTrack(token, trackId, value);
    await loadDemos();
  }

  async function handleUpload(formData: FormData) {
    if (!token || !uploadFile) {
      setUploadMessage("Choose a file and log in first.");
      return;
    }
    if (uploadSubmitting) return;

    setUploadSubmitting(true);
    const durationCheck = await validateAudioDuration(uploadFile, "demo");
    if (!durationCheck.ok) {
      setUploadMessage(durationCheck.message);
      setUploadSubmitting(false);
      return;
    }

    setUploadMessage("Analyzing aura colors...");
    setUploadAuraStatus("analyzing");
    await new Promise((resolve) => window.setTimeout(resolve, AURA_ANALYSIS_DELAY_MS));
    setUploadAuraStatus("revealed");
    setUploadMessage("Aura colors generated. Uploading demo...");

    const payload = await buildTrackUploadFormData(
      uploadFile,
      {
        title: String(formData.get("title") || ""),
        genre: selectedGenres.join(","),
        bpm: String(formData.get("bpm") || ""),
        musicalKey: String(formData.get("musicalKey") || ""),
        description: String(formData.get("description") || ""),
      },
      "demo"
    );

    const result = await uploadTrack(token, payload);
    if (!result.ok) {
      setUploadMessage(result.errorMessage);
      setUploadSubmitting(false);
      return;
    }

    closeUploadModal();
    setUploadMessage("");
    setSelectedGenres([]);
    setUploadFile(null);
    await loadDemos();
    if (result.data) {
      await toggleTrack(result.data);
    }
  }

  async function handleRating(formData: FormData) {
    if (!token || !selectedTrack) {
      setFeedbackMessage("Choose a demo and log in first.");
      return;
    }
    if (selectedTrack.userId === user?.id) {
      setFeedbackMessage("You cannot rate your own demo.");
      return;
    }

    const result = await saveRating(token, selectedTrack.id, {
      score: Number(formData.get("score") || 5),
      text: String(formData.get("text") || ""),
    });

    if (!result.ok) {
      setFeedbackMessage(result.errorMessage);
      return;
    }

    await openFeedback(selectedTrack.id);
    await loadDemos();
    setFeedbackMessage("Rating saved.");
  }

  async function handleComment(formData: FormData) {
    if (!token || !selectedTrack) {
      setFeedbackMessage("Choose a demo and log in first.");
      return;
    }

    const result = await saveComment(token, selectedTrack.id, {
      text: String(formData.get("text") || ""),
      parentId: replyTarget?.type === "comment" ? replyTarget.id : undefined,
      parentRatingId: replyTarget?.type === "rating" ? replyTarget.id : undefined,
    });
    if (!result.ok) {
      setFeedbackMessage(result.errorMessage);
      return;
    }

    setReplyTarget(null);
    await openFeedback(selectedTrack.id);
    setFeedbackMessage("Reply posted.");
  }

  async function handleReport(formData: FormData) {
    if (!token || !reportTrackItem) {
      setReportMessage("Choose a demo and log in first.");
      return;
    }

    const result = await reportTrack(token, reportTrackItem.id, {
      reason: String(formData.get("reason") || "other"),
      details: String(formData.get("details") || ""),
    });

    if (!result.ok) {
      setReportMessage(result.errorMessage);
      return;
    }

    setReportMessage("Report sent to moderation.");
    setReportOpen(false);
    setReportTrackItem(null);
  }

  function openCollab(track: Track) {
    if (!token) {
      navigate("/login");
      return;
    }
    if (track.userId === user?.id) return;
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

  async function handleCommentReport(formData: FormData) {
    if (!token || !selectedTrack || !reportCommentItem) {
      setReportMessage("Choose a comment and log in first.");
      return;
    }

    const result = await reportComment(token, selectedTrack.id, reportCommentItem.id, {
      reason: String(formData.get("reason") || "harassment"),
      details: String(formData.get("details") || ""),
    });

    if (!result.ok) {
      setReportMessage(result.errorMessage);
      return;
    }

    setReportMessage("Comment report sent to moderation.");
    setCommentReportOpen(false);
    setReportCommentItem(null);
  }

  async function handleDeleteOwnComment(commentId: string) {
    if (!token || !selectedTrack || !window.confirm("Delete your comment? Replies will stay visible.")) return;
    const result = await deleteOwnComment(token, selectedTrack.id, commentId);
    setFeedbackMessage(result.ok ? "Comment deleted." : result.errorMessage);
    if (result.ok) {
      await openFeedback(selectedTrack.id);
    }
  }

  function renderComment(comment: Comment, depth = 0) {
    const replies = comments.filter((item) => item.parentId === comment.id);

    return (
      <div key={comment.id} className="comment-thread" style={{ ["--thread-depth" as string]: String(Math.min(depth, 6)) }}>
        <article className={`feedback-item comment-row ${comment.parentId ? "comment-reply" : ""}`}>
          <div className="feedback-author">
            <Link className="feedback-avatar-link" to={`/profile/${comment.userId}`}>
              <img
                className="mini-avatar"
                src={comment.authorAvatarUrl ? buildMediaUrl(comment.authorAvatarUrl) : "/assets/avatar-placeholder.svg"}
                alt={`${comment.author} avatar`}
              />
            </Link>
            <div>
              <strong>
                <Link className="user-link" to={`/profile/${comment.userId}`}>
                  {comment.author}
                </Link>
              </strong>
              <span className="muted">{formatDate(comment.createdAt)}</span>
            </div>
          </div>
          <div className="feedback-item-body">
            <p className={comment.isDeleted ? "deleted-comment-text" : ""}>{comment.text}</p>
            <div className="comment-actions">
              {!comment.isDeleted ? (
                <>
                  <button className="btn ghost small" type="button" onClick={() => setReplyTarget({ type: "comment", id: comment.id, author: comment.author })}>
                    Reply
                  </button>
                  {comment.userId === user?.id ? (
                    <button className="btn ghost small" type="button" onClick={() => void handleDeleteOwnComment(comment.id)}>
                      Delete
                    </button>
                  ) : (
                    <button
                      className="btn ghost small"
                      type="button"
                      onClick={() => {
                        setReportCommentItem(comment);
                        setReportMessage("");
                        setCommentReportOpen(true);
                      }}
                    >
                      Report
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </article>
        {replies.length ? <div className="comment-replies">{replies.map((item) => renderComment(item, depth + 1))}</div> : null}
      </div>
    );
  }

  return (
    <main className="page-shell app-shell">
      <section className="app-layout demos-page-layout">
        <aside className="app-column app-sidebar" aria-hidden="true"></aside>

        <section className="app-column app-main">
          <section className="hero compact app-hero">
            <div>
              <p className="eyebrow">Demo board</p>
              <h1>A dedicated space for work-in-progress demos.</h1>
              <p className="hero-copy">Upload works in progress, preview Aura colors, play demos, and collect focused feedback in one place.</p>
            </div>
          </section>

          <section className="demo-mode-bar">
            <div>
              <h2>Discovery mode</h2>
              <p className="muted">Switch between your niche and the objectively strongest demos.</p>
            </div>
            <div className="segmented-control" aria-label="Demo discovery mode">
              <button className={mode === "for-you" ? "active" : ""} type="button" onClick={() => setMode("for-you")}>
                My Style
              </button>
              <button className={mode === "top" ? "active" : ""} type="button" onClick={() => setMode("top")}>
                Top Voted
              </button>
            </div>
          </section>

          <section className="surface-block">
            <div className="panel-header row-between">
              <div>
                <h2>Demo board</h2>
                <p className="muted">Play demos in the bottom bar, then open a full feedback panel from the same row.</p>
              </div>
              <div className="board-actions">
                <button className="btn" type="button" onClick={() => void loadDemos()}>
                  Refresh
                </button>
              </div>
            </div>
            <div className="library-list-head demo-list-head">
              <span>Demo</span>
              <span>Aura</span>
              <span>Details</span>
              <span>Actions</span>
            </div>
            <div className="demo-list">
              {demos.length ? (
                demos.map((track) => {
                  const trackIsPlaying = currentTrack?.id === track.id && isPlaying;
                  return (
                    <article
                      key={track.id}
                      className={`library-row demo-row aura-card ${trackIsPlaying ? "is-playing" : ""}`}
                      style={
                        {
                          ["--aura-gradient" as string]: track.aura.gradient,
                          ["--aura-primary" as string]: track.aura.primaryColor,
                          ["--aura-secondary" as string]: track.aura.secondaryColor,
                          ["--aura-accent" as string]: track.aura.accentColor,
                        } as React.CSSProperties
                      }
                    >
                      <div className="aura-preview" aria-hidden="true"></div>
                      <div className="demo-row-main">
                        <Link className="uploader-mini" to={`/profile/${track.userId}`}>
                          <img
                            className="mini-avatar"
                            src={track.userAvatarUrl ? buildMediaUrl(track.userAvatarUrl) : "/assets/avatar-placeholder.svg"}
                            alt={`${track.username} avatar`}
                          />
                          <span>
                            <strong>{track.username}</strong>
                            <small>Uploader profile</small>
                          </span>
                        </Link>
                        <div className="library-row-copy">
                          <h3>{track.title}</h3>
                          <p className="muted">{track.description || "No description yet."}</p>
                        </div>
                      </div>
                      <div className="demo-row-aura">
                        <button className="btn icon-btn aura-play-btn" onClick={() => void toggleTrack(track)}>
                          {trackIsPlaying ? "||" : "▶"}
                        </button>
                        <div
                          className={`aura-strip demo-aura-strip ${trackIsPlaying ? "is-playing" : ""}`}
                          style={
                            {
                              ["--aura-gradient" as string]: track.aura.gradient,
                              ["--aura-primary" as string]: track.aura.primaryColor,
                              ["--aura-secondary" as string]: track.aura.secondaryColor,
                              ["--aura-accent" as string]: track.aura.accentColor,
                            } as React.CSSProperties
                          }
                        >
                          <WaveformPreview active={trackIsPlaying} className="demo-aura-waveform" />
                        </div>
                      </div>
                      <div className="demo-row-details">
                        <div className="track-info-pills">
                          <span>{track.genre}</span>
                          <span>{track.bpm ? `${track.bpm} BPM` : "no BPM"}</span>
                          <span>{track.musicalKey || "no key"}</span>
                          <span>{track.energyLevel} energy</span>
                          <span>{formatDuration(track.durationSec)}</span>
                        </div>
                        <div className="meta-line">Uploaded: {formatDate(track.createdAt)}</div>
                      </div>
                      <div className="library-row-actions compact-actions demo-action-bar">
                        <TrackVoteControls
                          trackId={track.id}
                          upvoteCount={track.upvoteCount}
                          downvoteCount={track.downvoteCount}
                          onVote={(value) => void handleVote(track.id, value)}
                        />
                        {track.userId !== user?.id ? (
                          <button className="btn primary" onClick={() => void openFeedback(track.id)}>
                            Rate
                          </button>
                        ) : null}
                        {track.userId !== user?.id ? (
                          <button className="btn ghost small" onClick={() => openCollab(track)}>
                            Collab
                          </button>
                        ) : null}
                        {track.userId !== user?.id ? (
                          <button
                            className="btn ghost small"
                            onClick={() => {
                              setReportTrackItem(track);
                              setReportMessage("");
                              setReportOpen(true);
                            }}
                          >
                            Report
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="empty-state">No demos uploaded yet.</div>
              )}
            </div>
          </section>
        </section>
        <aside className="app-column app-rail" aria-hidden="true"></aside>
      </section>

      <Modal
        open={uploadOpen}
        onClose={closeUploadModal}
        panelClassName="demo-upload-dialog-panel"
        header={
          <div className="panel-header row-between">
            <div>
              <h2>Upload demo</h2>
              <p className="muted">Add a work-in-progress track and tag its mood for Aura.</p>
            </div>
            <button className="btn ghost" type="button" onClick={closeUploadModal}>
              Close
            </button>
          </div>
        }
      >
        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleUpload(new FormData(event.currentTarget));
          }}
        >
          <label>
            Audio file
            <input type="file" accept="audio/*" required onChange={(event) => setUploadFile(event.target.files?.[0] || null)} />
          </label>
          <div className="field-hint">
            {uploadFile ? uploadFile.name : `No demo file selected. Max length: ${Math.round(AUDIO_DURATION_LIMITS_SEC.demo / 60)} minutes.`}
          </div>
          <label>
            Title
            <input name="title" placeholder="Summer Tape Demo" required />
          </label>
          <div className="field-group">
            <span className="field-label">Genres (max 3)</span>
            <InterestPicker options={INTEREST_OPTIONS} selected={selectedGenres} onChange={setSelectedGenres} maxSelected={3} />
          </div>
          <div
            className={`aura-upload-preview ${uploadAuraStatus}`}
            style={
              {
                ["--aura-gradient" as string]: uploadAuraStatus === "revealed" ? uploadAuraPreview.gradient : "linear-gradient(135deg, #2b2b32, #3a3232 58%, #1d2930)",
                ["--aura-primary" as string]: uploadAuraStatus === "revealed" ? uploadAuraPreview.primaryColor : "#56565d",
                ["--aura-secondary" as string]: uploadAuraStatus === "revealed" ? uploadAuraPreview.secondaryColor : "#3e3e45",
                ["--aura-accent" as string]: uploadAuraStatus === "revealed" ? uploadAuraPreview.accentColor : "#6a6a72",
              } as React.CSSProperties
            }
          >
            <div>
              <span className="field-label">Aura preview</span>
              <strong>
                {uploadAuraStatus === "idle"
                  ? "Waiting for upload"
                  : uploadAuraStatus === "analyzing"
                    ? "Analyzing track mood..."
                    : `${formatInterestLabel(uploadAuraPreview.genre)} color blend`}
              </strong>
            </div>
            <div className={`aura-strip demo-aura-strip upload-aura-strip ${uploadAuraStatus !== "idle" ? "is-playing" : ""}`}>
              <WaveformPreview active={uploadAuraStatus !== "idle"} className="demo-aura-waveform" />
            </div>
          </div>
          <label>
            BPM
            <input name="bpm" type="number" min="1" max="400" placeholder="Optional" />
          </label>
          <label>
            Key
            <input name="musicalKey" placeholder="F#m" />
          </label>
          <label>
            Description
            <textarea name="description" rows={4} placeholder="Pre-master demo, still shaping the chorus hook and low end." />
          </label>
          <button className="btn primary" type="submit" disabled={uploadSubmitting}>
            {uploadSubmitting ? "Processing..." : "Upload demo"}
          </button>
          {uploadMessage ? <div className={`msg ${uploadMessage.includes("uploaded") ? "ok" : "err"}`}>{uploadMessage}</div> : null}
        </form>
      </Modal>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        header={
          <div className="panel-header row-between">
            <div>
              <p className="eyebrow">Report demo</p>
              <h2>{reportTrackItem?.title || "Selected demo"}</h2>
              <p className="muted">Flag unwanted, misleading or inappropriate demo content for admin review.</p>
            </div>
            <button className="btn ghost" type="button" onClick={() => setReportOpen(false)}>
              Close
            </button>
          </div>
        }
      >
        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleReport(new FormData(event.currentTarget));
          }}
        >
          <label>
            Reason
            <select name="reason" defaultValue="spam">
              <option value="spam">Spam / unwanted content</option>
              <option value="harassment">Harassment</option>
              <option value="copyright">Copyright concern</option>
              <option value="explicit">Explicit or unsafe content</option>
              <option value="misleading">Misleading metadata</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Details
            <textarea name="details" rows={4} placeholder="Briefly explain what the admin should review." />
          </label>
          <button className="btn primary" type="submit">
            Send report
          </button>
          {reportMessage ? <div className={`msg ${reportMessage.includes("sent") ? "ok" : "err"}`}>{reportMessage}</div> : null}
        </form>
      </Modal>

      <Modal
        open={collabOpen}
        onClose={() => setCollabOpen(false)}
        panelClassName="collab-dialog-panel"
        header={
          <div className="panel-header row-between">
            <div>
              <p className="eyebrow">Collab request</p>
              <h2>{collabTrackItem?.title || "Selected demo"}</h2>
              <p className="muted">Send a focused request to the demo owner.</p>
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
            <span className="field-label">What can you help with?</span>
            <div className="compact-chip-grid">
              {COLLAB_SKILLS.map((skill) => (
                <label key={skill} className="check-chip">
                  <input type="checkbox" name="skills" value={skill} />
                  <span>{formatInterestLabel(skill)}</span>
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

      <Modal
        open={commentReportOpen}
        onClose={() => setCommentReportOpen(false)}
        header={
          <div className="panel-header row-between">
            <div>
              <p className="eyebrow">Report comment</p>
              <h2>{reportCommentItem?.author || "Selected comment"}</h2>
              <p className="muted">Flag abusive, spammy or unwanted feedback for admin review.</p>
            </div>
            <button className="btn ghost" type="button" onClick={() => setCommentReportOpen(false)}>
              Close
            </button>
          </div>
        }
      >
        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCommentReport(new FormData(event.currentTarget));
          }}
        >
          <label>
            Reason
            <select name="reason" defaultValue="harassment">
              <option value="harassment">Harassment or abusive comment</option>
              <option value="spam">Spam or unwanted promotion</option>
              <option value="explicit">Explicit or unsafe content</option>
              <option value="misleading">Misleading feedback</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Details
            <textarea name="details" rows={4} placeholder="Briefly explain what the admin should review." />
          </label>
          <button className="btn primary" type="submit">
            Send report
          </button>
          {reportMessage ? <div className={`msg ${reportMessage.includes("sent") ? "ok" : "err"}`}>{reportMessage}</div> : null}
        </form>
      </Modal>

      <Modal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        wide
        header={
          <div className="panel-header row-between">
            <div>
              <p className="eyebrow">Demo feedback</p>
              <h2>{selectedTrack?.title || "Nothing selected"}</h2>
              <p className="muted">
                {selectedTrack
                  ? `${selectedTrack.username} | ${selectedTrack.genre} | ${selectedTrack.bpm ? `${selectedTrack.bpm} BPM` : "no BPM"} | ${formatDuration(selectedTrack.durationSec)}`
                  : "Choose a demo from the board."}
              </p>
            </div>
            <button className="btn ghost" type="button" onClick={() => setFeedbackOpen(false)}>
              Close
            </button>
          </div>
        }
      >
        <div className="selected-description">{selectedTrack?.description || "No description yet."}</div>
        <div className="feedback-overview">
          <div className="stat-card">
            <span>Average</span>
            <strong>{selectedTrack ? (ratings.length ? Number(selectedTrack.ratingAverage || 0).toFixed(1) : "--") : "--"}</strong>
          </div>
          <div className="stat-card">
            <span>Feedback</span>
            <strong>{ratings.length}</strong>
          </div>
          <div className="stat-card">
            <span>Comments</span>
            <strong>{comments.length}</strong>
          </div>
        </div>

        <div className="feedback-dialog-grid">
          <section className="surface-block feedback-form-panel">
            {selectedTrack?.userId !== user?.id ? (
              <>
                <div className="panel-header">
                  <h2>Rate demo</h2>
                  <p className="muted">Choose a score and add one clear feedback note.</p>
                </div>
                <form
                  className="stack-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleRating(new FormData(event.currentTarget));
                  }}
                >
                  <div className="field-group">
                    <span className="field-label">Score</span>
                    <div className="score-grid">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <label key={value}>
                          <input type="radio" name="score" value={value} defaultChecked={value === 5} />
                          <span>{value}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <label>
                    Feedback
                    <textarea name="text" rows={4} placeholder="Great mood overall, but the top end could open up more." />
                  </label>
                  <button className="btn primary" type="submit">
                    Save feedback
                  </button>
                </form>
              </>
            ) : (
              <div className="panel-header">
                <h2>Own demo</h2>
                <p className="muted">You can read feedback here, but you cannot rate your own demo.</p>
              </div>
            )}

            {replyTarget ? (
              <>
                <hr className="sep" />
                <div className="panel-header">
                  <h2>Reply</h2>
                  <p className="muted">Replying to {replyTarget.author}'s feedback.</p>
                </div>
                <form
                  className="stack-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleComment(new FormData(event.currentTarget));
                  }}
                >
                  <label>
                    Reply
                    <textarea name="text" rows={4} placeholder="Write your reply..." required />
                  </label>
                  <div className="card-actions">
                    <button className="btn" type="submit">
                      Post reply
                    </button>
                    <button className="btn ghost" type="button" onClick={() => setReplyTarget(null)}>
                      Cancel reply
                    </button>
                  </div>
                </form>
              </>
            ) : null}
            {feedbackMessage ? <div className={`msg ${feedbackMessage.includes("saved") || feedbackMessage.includes("posted") ? "ok" : "err"}`}>{feedbackMessage}</div> : null}
          </section>

          <section className="feedback-thread-panel">
            <div className="surface-block">
              <div className="panel-header">
                <h2>Feedback</h2>
                <p className="muted">Scores, written feedback and replies in one timeline.</p>
              </div>
              <div className="feedback-timeline">
                {timeline.length ? (
                  timeline.map((item) =>
                    item.type === "rating" ? (
                      <div key={item.id} className="comment-thread" style={{ ["--thread-depth" as string]: "0" }}>
                        <article className="feedback-item feedback-rating">
                          <div className="feedback-author">
                            <Link className="feedback-avatar-link" to={`/profile/${item.userId}`}>
                              <img
                                className="mini-avatar"
                                src={item.authorAvatarUrl ? buildMediaUrl(item.authorAvatarUrl) : "/assets/avatar-placeholder.svg"}
                                alt={`${item.author} avatar`}
                              />
                            </Link>
                            <div>
                              <strong>
                                <Link className="user-link" to={`/profile/${item.userId}`}>
                                  {item.author}
                                </Link>
                              </strong>
                              <span className="muted">{formatDate(item.updatedAt)}</span>
                            </div>
                          </div>
                          <div className="feedback-item-body">
                            <div className="feedback-item-head">
                              <span className="rating-badge">{item.score}/5</span>
                            </div>
                            <p>{item.text || "No note attached."}</p>
                            <div className="comment-actions">
                              <button className="btn ghost small" type="button" onClick={() => setReplyTarget({ type: "rating", id: item.id, author: item.author })}>
                                Reply
                              </button>
                            </div>
                          </div>
                        </article>
                        {comments.filter((comment) => comment.parentRatingId === item.id).length ? (
                          <div className="comment-replies">
                            {comments.filter((comment) => comment.parentRatingId === item.id).map((comment) => renderComment(comment, 1))}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      renderComment(item)
                    )
                  )
                ) : (
                  <div className="empty-state inline-empty">No feedback for this demo yet.</div>
                )}
              </div>
            </div>
          </section>
        </div>
      </Modal>
    </main>
  );
}
