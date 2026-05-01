import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  adminDeleteUser,
  adminDeleteComment,
  adminDeleteTrack,
  clearAdminTrackRisk,
  fetchAdminComments,
  fetchAdminOverview,
  fetchAdminReports,
  fetchTrack,
  fetchAdminTracks,
  fetchAdminUsers,
  updateAdminReport,
  updateUserModeration,
} from "../lib/api";
import { buildApiUrl, formatDate, formatDuration, formatFileSize, formatTimestamp } from "../lib/format";
import { useAuth } from "../contexts/AuthContext";
import { Modal } from "../components/Modal";
import { WaveformPreview } from "../components/WaveformPreview";
import type { AdminOverview, AdminUser, Comment, Report, Track } from "../types";

type AdminTab = "reports" | "reviewed" | "ai-review" | "tracks" | "comments" | "users";

const emptyOverview: AdminOverview = {
  userCount: 0,
  sampleCount: 0,
  demoCount: 0,
  suspiciousSampleCount: 0,
  commentCount: 0,
  ratingCount: 0,
  totalPlays: 0,
  totalUpvotes: 0,
  totalDownvotes: 0,
  openReportCount: 0,
};

export function AdminPage() {
  const { token, user } = useAuth();
  const [overview, setOverview] = useState<AdminOverview>(emptyOverview);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>("reports");
  const [message, setMessage] = useState("");
  const [reviewReport, setReviewReport] = useState<Report | null>(null);
  const [reviewTrack, setReviewTrack] = useState<Track | null>(null);
  const [reviewMessage, setReviewMessage] = useState("");
  const [moderationUser, setModerationUser] = useState<AdminUser | null>(null);
  const [moderationMessage, setModerationMessage] = useState("");
  const [aiActionTrack, setAiActionTrack] = useState<Track | null>(null);
  const [aiActionMessage, setAiActionMessage] = useState("");

  const isAdmin = user?.role === "admin";
  const openReports = reports.filter((report) => report.status === "open");
  const reviewedReports = reports.filter((report) => report.status !== "open");
  const suspiciousSamples = tracks.filter((track) => track.kind === "sample" && track.aiRiskLevel === "suspicious");

  async function loadAdminData() {
    if (!token || !isAdmin) return;
    const [overviewResult, usersResult, tracksResult, commentsResult, reportsResult] = await Promise.all([
      fetchAdminOverview(token),
      fetchAdminUsers(token),
      fetchAdminTracks(token),
      fetchAdminComments(token),
      fetchAdminReports(token),
    ]);

    if (overviewResult.data) setOverview(overviewResult.data);
    if (usersResult.data) setUsers(usersResult.data.items);
    if (tracksResult.data) setTracks(tracksResult.data.items);
    if (commentsResult.data) setComments(commentsResult.data.items);
    if (reportsResult.data) setReports(reportsResult.data.items);

    const firstError = [overviewResult, usersResult, tracksResult, commentsResult, reportsResult].find((result) => !result.ok);
    setMessage(firstError ? firstError.errorMessage : "");
  }

  useEffect(() => {
    void loadAdminData();
  }, [token, isAdmin]);

  async function handleDeleteTrack(trackId: string) {
    if (!token || !window.confirm("Delete this track and its related feedback?")) return;
    const result = await adminDeleteTrack(token, trackId);
    setMessage(result.ok ? "Track deleted." : result.errorMessage);
    if (result.ok) {
      await loadAdminData();
    }
  }

  async function handleClearTrackRisk(trackId: string) {
    if (!token) return;
    const result = await clearAdminTrackRisk(token, trackId);
    setMessage(result.ok ? "AI risk flag cleared." : result.errorMessage);
    if (result.ok) {
      await loadAdminData();
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!token || !window.confirm("Delete this comment and its replies?")) return;
    const result = await adminDeleteComment(token, commentId);
    setMessage(result.ok ? "Comment deleted." : result.errorMessage);
    if (result.ok) {
      await loadAdminData();
    }
  }

  async function handleAiReviewSubmit(formData: FormData) {
    if (!token || !aiActionTrack) return;
    const action = String(formData.get("action") || "delete") as "delete" | "delete-warn" | "delete-ban";
    const reason = String(formData.get("reason") || "").trim();
    const owner = users.find((item) => item.id === aiActionTrack.userId);

    if (action !== "delete" && !reason) {
      setAiActionMessage("Add a short moderation message for the uploader.");
      return;
    }

    const deleteResult = await adminDeleteTrack(token, aiActionTrack.id);
    if (!deleteResult.ok) {
      setAiActionMessage(deleteResult.errorMessage);
      return;
    }

    if (action !== "delete") {
      if (!owner) {
        setAiActionMessage("Sample deleted, but the uploader could not be found for moderation.");
        await loadAdminData();
        return;
      }

      const moderationResult = await updateUserModeration(token, owner.id, {
        action: action === "delete-ban" ? "ban" : "warn",
        reason,
      });

      if (!moderationResult.ok) {
        setAiActionMessage(`Sample deleted, but moderation failed: ${moderationResult.errorMessage}`);
        await loadAdminData();
        return;
      }
    }

    setMessage(action === "delete" ? "Suspicious sample deleted." : "Suspicious sample deleted and uploader moderated.");
    setAiActionTrack(null);
    setAiActionMessage("");
    await loadAdminData();
  }

  async function openReportReview(report: Report) {
    setReviewReport(report);
    setReviewMessage("");
    const trackResult = await fetchTrack(report.trackId);
    setReviewTrack(trackResult.data || null);
    if (!trackResult.ok) {
      setReviewMessage(trackResult.errorMessage);
    }
  }

  async function handleInvalidReport() {
    if (!token || !reviewReport) return;
    const result = await updateAdminReport(token, reviewReport.id, {
      status: "reviewed",
      resolutionNote: "Report reviewed and marked invalid.",
    });
    setReviewMessage(result.ok ? "Report marked as reviewed." : result.errorMessage);
    if (result.ok) {
      await loadAdminData();
      setReviewReport(null);
      setReviewTrack(null);
    }
  }

  async function handleReportModerationAction(action: "warn" | "ban") {
    if (!token || !reviewReport) return;
    const targetUserId = reviewReport.targetType === "comment" ? reviewReport.commentAuthorId : reviewReport.trackOwnerId;
    if (!targetUserId) {
      setReviewMessage("No moderation target is available for this report.");
      return;
    }
    const defaultReason = action === "warn"
      ? `Warning after valid ${reviewReport.targetType} report: ${reviewReport.reason}.`
      : `Ban after valid ${reviewReport.targetType} report: ${reviewReport.reason}.`;
    const reason = window.prompt("Moderation reason", defaultReason);
    if (reason === null) return;

    const moderationResult = await updateUserModeration(token, targetUserId, { action, reason });
    if (!moderationResult.ok) {
      setReviewMessage(moderationResult.errorMessage);
      return;
    }

    const reportResult = await updateAdminReport(token, reviewReport.id, {
      status: "actioned",
      resolutionNote: `${action === "warn" ? "Warning" : "Ban"} issued to uploader. ${reason}`,
    });
    setReviewMessage(reportResult.ok ? "Report actioned." : reportResult.errorMessage);
    if (reportResult.ok) {
      await loadAdminData();
      setReviewReport(null);
      setReviewTrack(null);
    }
  }

  async function handleReportDeleteContent() {
    if (!token || !reviewReport) return;
    const confirmed = window.confirm(`Delete reported ${reviewReport.targetType}?`);
    if (!confirmed) return;

    await updateAdminReport(token, reviewReport.id, {
      status: "actioned",
      resolutionNote: `Reported ${reviewReport.targetType} removed by admin.`,
    });
    const result = reviewReport.targetType === "comment" && reviewReport.commentId
      ? await adminDeleteComment(token, reviewReport.commentId)
      : await adminDeleteTrack(token, reviewReport.trackId);
    setReviewMessage(result.ok ? "Reported content deleted." : result.errorMessage);
    if (result.ok) {
      await loadAdminData();
      setReviewReport(null);
      setReviewTrack(null);
    }
  }

  async function handleModerateUser(userId: string, action: "warn" | "ban" | "clear", reason = "") {
    if (!token) return;
    const result = await updateUserModeration(token, userId, { action, reason: reason || "" });
    setMessage(result.ok ? "User moderation updated." : result.errorMessage);
    if (result.ok) {
      await loadAdminData();
      setModerationUser(null);
      setModerationMessage("");
    }
  }

  async function handleModerationSubmit(formData: FormData) {
    if (!moderationUser) return;
    const action = String(formData.get("action") || "warn") as "warn" | "ban" | "clear";
    const reason = String(formData.get("reason") || "").trim();
    if (action !== "clear" && !reason) {
      setModerationMessage("Add a short moderation message.");
      return;
    }
    await handleModerateUser(moderationUser.id, action, reason);
  }

  async function handleDeleteUser(userId: string, username: string) {
    if (!token) return;
    const confirmed = window.confirm(
      `Delete ${username}? This removes the user, their samples, demos, comments, ratings, votes, reports and uploaded files.`
    );
    if (!confirmed) return;

    const result = await adminDeleteUser(token, userId);
    setMessage(result.ok ? `User deleted with ${result.data?.deleted.tracks || 0} upload(s).` : result.errorMessage);
    if (result.ok) {
      await loadAdminData();
    }
  }

  if (!isAdmin) {
    return (
      <main className="page-shell app-shell single-column-layout">
        <section className="hero-block compact">
          <span className="eyebrow">Admin</span>
          <h1>Admin access required.</h1>
          <p>Log in with an administrator account to use the moderation dashboard.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell app-shell single-column-layout">
      <section className="hero-block compact">
        <span className="eyebrow">Admin</span>
        <h1>Moderation dashboard.</h1>
        <p>Review platform activity, inspect uploaded tracks and remove content when needed.</p>
      </section>

      <section className="admin-stats-grid">
        <StatCard label="Users" value={overview.userCount} />
        <StatCard label="Samples" value={overview.sampleCount} />
        <StatCard label="Demos" value={overview.demoCount} />
        <StatCard label="Suspicious samples" value={overview.suspiciousSampleCount || 0} />
        <StatCard label="Comments" value={overview.commentCount} />
        <StatCard label="Ratings" value={overview.ratingCount} />
        <StatCard label="Plays" value={overview.totalPlays} />
        <StatCard label="Upvotes" value={overview.totalUpvotes} />
        <StatCard label="Downvotes" value={overview.totalDownvotes} />
        <StatCard label="Open reports" value={overview.openReportCount} />
      </section>

      <section className="surface-block admin-panel">
        <div className="panel-header admin-toolbar">
          <div>
            <h2>Admin tools</h2>
            <p>{message || "Role-protected moderation actions are available here."}</p>
          </div>
          <div className="segmented-control">
            <button className={activeTab === "reports" ? "active" : ""} onClick={() => setActiveTab("reports")}>
              Open reports
            </button>
            <button className={activeTab === "reviewed" ? "active" : ""} onClick={() => setActiveTab("reviewed")}>
              Reviewed
            </button>
            <button className={activeTab === "ai-review" ? "active" : ""} onClick={() => setActiveTab("ai-review")}>
              AI review
            </button>
            <button className={activeTab === "tracks" ? "active" : ""} onClick={() => setActiveTab("tracks")}>
              Tracks
            </button>
            <button className={activeTab === "comments" ? "active" : ""} onClick={() => setActiveTab("comments")}>
              Comments
            </button>
            <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>
              Users
            </button>
          </div>
        </div>

        {activeTab === "reports" ? (
          <div className="admin-table">
            <div className="admin-row admin-report-row admin-row-head">
              <span>Report</span>
              <span>Upload</span>
              <span>Status</span>
              <span>Created</span>
              <span>Action</span>
            </div>
            {openReports.map((report) => (
              <div className="admin-row admin-report-row" key={report.id}>
                <span>
                  <strong>{report.reason}</strong>
                  <small>{report.targetType} report by {report.reporterUsername}</small>
                </span>
                <span>
                  <button className="link-button strong-link" type="button" onClick={() => void openReportReview(report)}>
                    {report.targetType === "comment" ? report.commentAuthorUsername || "Reported comment" : report.trackTitle}
                  </button>
                  <small>
                    {report.targetType === "comment"
                      ? `On ${report.trackTitle}`
                      : `${report.trackKind} by ${report.trackOwnerUsername}`}
                  </small>
                </span>
                <span>{report.status}</span>
                <span>{formatDate(report.createdAt)}</span>
                <span className="admin-action-stack">
                  <button className="btn small" onClick={() => void openReportReview(report)}>
                    Open review
                  </button>
                </span>
              </div>
            ))}
            {!openReports.length ? <div className="empty-row">No open reports.</div> : null}
          </div>
        ) : null}

        {activeTab === "reviewed" ? (
          <div className="admin-table">
            <div className="admin-row admin-report-row admin-row-head">
              <span>Report</span>
              <span>Target</span>
              <span>Status</span>
              <span>Resolved</span>
              <span>Check</span>
            </div>
            {reviewedReports.map((report) => (
              <div className="admin-row admin-report-row" key={report.id}>
                <span>
                  <strong>{report.reason}</strong>
                  <small>{report.targetType} report by {report.reporterUsername}</small>
                </span>
                <span>
                  <button className="link-button strong-link" type="button" onClick={() => void openReportReview(report)}>
                    {report.targetType === "comment" ? report.commentAuthorUsername || "Reported comment" : report.trackTitle}
                  </button>
                  <small>{report.resolutionNote || "No resolution note."}</small>
                </span>
                <span>{report.status}</span>
                <span>{formatDate(report.resolvedAt || report.createdAt)}</span>
                <span className="admin-action-stack">
                  <button className="btn ghost small" onClick={() => void openReportReview(report)}>
                    Inspect
                  </button>
                </span>
              </div>
            ))}
            {!reviewedReports.length ? <div className="empty-row">No reviewed reports yet.</div> : null}
          </div>
        ) : null}

        {activeTab === "ai-review" ? (
          <div className="admin-table ai-review-table">
            <div className="admin-row ai-review-row admin-row-head">
              <span>Sample</span>
              <span>Preview</span>
              <span>AI reason</span>
              <span>Stats</span>
              <span>Uploaded</span>
              <span>Action</span>
            </div>
            {suspiciousSamples.map((track) => (
              <div className="admin-row ai-review-row" key={track.id}>
                <span>
                  <strong>{track.title}</strong>
                  <small>{track.username} | {track.genre} | {formatFileSize(track.fileSize)}</small>
                  <small className="ai-risk-badge suspicious">AI risk: suspicious</small>
                </span>
                <span>
                  <AdminInlinePlayer track={track} compact />
                </span>
                <span>
                  {(track.aiRiskReasons && track.aiRiskReasons.length)
                    ? track.aiRiskReasons.join(" | ")
                    : track.aiAdminNote || "AI marked this sample for manual review."}
                </span>
                <span>{track.playCount} plays | +{track.upvoteCount} / -{track.downvoteCount}</span>
                <span>{formatDate(track.createdAt)}</span>
                <span className="admin-action-stack ai-review-actions">
                  <button
                    className="btn danger small ai-primary-action"
                    type="button"
                    onClick={() => {
                      setAiActionTrack(track);
                      setAiActionMessage("");
                    }}
                  >
                    Review action
                  </button>
                  <button className="btn ghost small ai-secondary-action" onClick={() => void handleClearTrackRisk(track.id)}>
                    Clear AI flag
                  </button>
                </span>
              </div>
            ))}
            {!suspiciousSamples.length ? <div className="empty-row">No suspicious samples waiting for AI review.</div> : null}
          </div>
        ) : null}

        {activeTab === "tracks" ? (
          <div className="admin-table">
            <div className="admin-row admin-user-row admin-row-head">
              <span>Track</span>
              <span>Type</span>
              <span>Stats</span>
              <span>Uploaded</span>
              <span>Action</span>
            </div>
            {tracks.map((track) => (
              <div className="admin-row" key={track.id}>
                <span>
                  <strong>{track.title}</strong>
                  <small>{track.username} | {track.genre} | {formatFileSize(track.fileSize)}</small>
                </span>
                <span>{track.kind}</span>
                <span>{track.playCount} plays | +{track.upvoteCount} / -{track.downvoteCount}</span>
                <span>{formatDate(track.createdAt)}</span>
                <span className="admin-action-stack">
                  <button className="btn danger small" onClick={() => void handleDeleteTrack(track.id)}>
                    Delete
                  </button>
                </span>
              </div>
            ))}
            {!tracks.length ? <div className="empty-row">No tracks yet.</div> : null}
          </div>
        ) : null}

        {activeTab === "comments" ? (
          <div className="admin-table">
            <div className="admin-row admin-row-head">
              <span>Author</span>
              <span>Comment</span>
              <span>Created</span>
              <span>Action</span>
            </div>
            {comments.map((comment) => (
              <div className="admin-row admin-comment-row" key={comment.id}>
                <span>
                  <strong>{comment.author}</strong>
                  <small>{comment.parentId ? "Reply" : "Top-level"}</small>
                </span>
                <span>{comment.text}</span>
                <span>{formatDate(comment.createdAt)}</span>
                <span>
                  <button className="btn danger small" onClick={() => void handleDeleteComment(comment.id)}>
                    Delete
                  </button>
                </span>
              </div>
            ))}
            {!comments.length ? <div className="empty-row">No comments yet.</div> : null}
          </div>
        ) : null}

        {activeTab === "users" ? (
          <div className="admin-table">
            <div className="admin-row admin-row-head">
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Joined</span>
              <span>Action</span>
            </div>
            {users.map((adminUser) => (
              <div className="admin-row admin-user-row" key={adminUser.id}>
                <span>
                  <strong>{adminUser.username}</strong>
                  <small>{adminUser.interests.slice(0, 3).join(" | ") || "No interests"}</small>
                </span>
                <span>{adminUser.email}</span>
                <span>{adminUser.role}</span>
                <span>
                  {adminUser.moderationStatus}
                  <small>{adminUser.warningCount} warning(s)</small>
                </span>
                <span>{formatDate(adminUser.createdAt || "")}</span>
                <span className="admin-action-stack">
                  <button
                    className="btn small"
                    type="button"
                    onClick={() => {
                      setModerationUser(adminUser);
                      setModerationMessage("");
                    }}
                  >
                    Moderate
                  </button>
                  {adminUser.role !== "admin" ? (
                    <button className="btn danger small" onClick={() => void handleDeleteUser(adminUser.id, adminUser.username)}>
                      Delete user
                    </button>
                  ) : null}
                </span>
              </div>
            ))}
            {!users.length ? <div className="empty-row">No users yet.</div> : null}
          </div>
        ) : null}
      </section>
      <Modal
        open={Boolean(moderationUser)}
        panelClassName="moderation-dialog-panel"
        onClose={() => {
          setModerationUser(null);
          setModerationMessage("");
        }}
        header={
          <div className="panel-header row-between">
            <div>
              <p className="eyebrow">User moderation</p>
              <h2>{moderationUser?.username || "Selected user"}</h2>
              <p className="muted">Choose an account action and attach a clear message for the user.</p>
            </div>
            <button className="btn ghost" type="button" onClick={() => setModerationUser(null)}>
              Close
            </button>
          </div>
        }
      >
        {moderationUser ? (
          <form
            className="stack-form moderation-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleModerationSubmit(new FormData(event.currentTarget));
            }}
          >
            <div className="moderation-target-card">
              <strong>{moderationUser.email}</strong>
              <span>{moderationUser.moderationStatus} | {moderationUser.warningCount} warning(s)</span>
            </div>
            <label>
              Action
              <select name="action" defaultValue="warn">
                <option value="warn">Warn / kick notice</option>
                <option value="ban">Ban account</option>
                <option value="clear">Clear moderation status</option>
              </select>
            </label>
            <label>
              Message
              <textarea name="reason" rows={4} placeholder="Explain the moderation reason or the expected behavior change." />
            </label>
            <button className="btn primary" type="submit">
              Apply action
            </button>
            {moderationMessage ? <div className="msg err">{moderationMessage}</div> : null}
          </form>
        ) : null}
      </Modal>
      <Modal
        open={Boolean(aiActionTrack)}
        panelClassName="moderation-dialog-panel"
        onClose={() => {
          setAiActionTrack(null);
          setAiActionMessage("");
        }}
        header={
          <div className="panel-header row-between">
            <div>
              <p className="eyebrow">AI sample review</p>
              <h2>{aiActionTrack?.title || "Suspicious sample"}</h2>
              <p className="muted">Delete the flagged sample and optionally moderate the uploader in the same step.</p>
            </div>
            <button className="btn ghost" type="button" onClick={() => setAiActionTrack(null)}>
              Close
            </button>
          </div>
        }
      >
        {aiActionTrack ? (
          <form
            className="stack-form moderation-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleAiReviewSubmit(new FormData(event.currentTarget));
            }}
          >
            <div className="moderation-target-card">
              <strong>{aiActionTrack.username}</strong>
              <span>{aiActionTrack.genre} | {formatFileSize(aiActionTrack.fileSize)} | AI risk: suspicious</span>
              <span>{aiActionTrack.aiRiskReasons?.join(" | ") || aiActionTrack.aiAdminNote || "AI marked this sample for manual review."}</span>
            </div>
            <label>
              Action
              <select name="action" defaultValue="delete-warn">
                <option value="delete">Delete sample only</option>
                <option value="delete-warn">Delete sample + warn uploader</option>
                <option value="delete-ban">Delete sample + ban uploader</option>
              </select>
            </label>
            <label>
              Message
              <textarea
                name="reason"
                rows={4}
                placeholder="Explain the copyright, spam or upload-quality issue to the uploader."
                defaultValue="The uploaded sample was flagged for possible licensing or source issues. Please upload only original or clearly royalty-free material."
              />
            </label>
            <button className="btn primary" type="submit">
              Apply review action
            </button>
            {aiActionMessage ? <div className="msg err">{aiActionMessage}</div> : null}
          </form>
        ) : null}
      </Modal>
      <Modal
        open={Boolean(reviewReport)}
        onClose={() => {
          setReviewReport(null);
          setReviewTrack(null);
        }}
        wide
        header={
          <div className="panel-header row-between">
            <div>
              <p className="eyebrow">Report review</p>
              <h2>{reviewReport?.targetType === "comment" ? "Reported comment" : reviewReport?.trackTitle || "Reported upload"}</h2>
              <p className="muted">
                {reviewReport ? `${reviewReport.targetType} report by ${reviewReport.reporterUsername}` : "Open a report to review it."}
              </p>
            </div>
            <button
              className="btn ghost"
              type="button"
              onClick={() => {
                setReviewReport(null);
                setReviewTrack(null);
              }}
            >
              Close
            </button>
          </div>
        }
      >
        {reviewReport ? (
          <div className="admin-review-grid">
            <section className="surface-block">
              <div className="panel-header">
                <h2>Reported content</h2>
                <p className="muted">Open the material, listen here, then decide on the report.</p>
              </div>
              <div className="reported-content-card">
                <div>
                  <strong>{reviewReport.targetType === "comment" ? reviewReport.commentAuthorUsername || "Reported comment" : reviewReport.trackTitle}</strong>
                  <span className="muted">
                    {reviewReport.targetType === "comment"
                      ? `Comment on ${reviewReport.trackTitle}`
                      : `${reviewReport.trackKind} by ${reviewReport.trackOwnerUsername}`}
                  </span>
                </div>
                {reviewReport.targetType === "comment" ? (
                  <blockquote className="reported-comment-text">
                    {reviewReport.commentText || "No comment snapshot is available."}
                  </blockquote>
                ) : null}
                {reviewTrack ? (
                  <>
                    <div className="track-info-pills">
                      <span>{reviewTrack.genre}</span>
                      <span>{reviewTrack.bpm ? `${reviewTrack.bpm} BPM` : "no BPM"}</span>
                      <span>{reviewTrack.musicalKey || "no key"}</span>
                      <span>{reviewTrack.energyLevel} energy</span>
                      <span>{formatDuration(reviewTrack.durationSec)}</span>
                    </div>
                    <div className="card-actions admin-review-actions">
                      <AdminInlinePlayer track={reviewTrack} />
                      <Link className="btn ghost" to={`/profile/${reviewReport.trackOwnerId}`}>
                        Uploader profile
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="empty-row">The upload may have been deleted already.</div>
                )}
              </div>
            </section>

            <section className="surface-block">
              <div className="panel-header">
                <h2>Report details</h2>
                <p className="muted">{reviewReport.status}</p>
              </div>
              <div className="report-detail-stack">
                <div>
                  <span className="field-label">Reason</span>
                  <strong>{reviewReport.reason}</strong>
                </div>
                <div>
                  <span className="field-label">Reporter</span>
                  <Link className="user-link" to={`/profile/${reviewReport.reporterId}`}>
                    {reviewReport.reporterUsername}
                  </Link>
                </div>
                <div>
                  <span className="field-label">Details</span>
                  <p>{reviewReport.details || "No details were provided."}</p>
                </div>
                <div className="admin-action-stack">
                  {reviewReport.status === "open" ? (
                    <>
                      <button className="btn ghost" onClick={() => void handleInvalidReport()}>
                        Invalid report
                      </button>
                      <button className="btn" onClick={() => void handleReportModerationAction("warn")}>
                        Warn {reviewReport.targetType === "comment" ? "commenter" : "uploader"}
                      </button>
                      <button className="btn danger" onClick={() => void handleReportModerationAction("ban")}>
                        Ban {reviewReport.targetType === "comment" ? "commenter" : "uploader"}
                      </button>
                      <button className="btn danger" onClick={() => void handleReportDeleteContent()}>
                        Delete {reviewReport.targetType === "comment" ? "comment" : "upload"}
                      </button>
                    </>
                  ) : (
                    <div className="empty-row">This report is closed and kept here for audit only.</div>
                  )}
                </div>
                {reviewMessage ? <div className={`msg ${reviewMessage.includes("Report") || reviewMessage.includes("deleted") ? "ok" : "err"}`}>{reviewMessage}</div> : null}
              </div>
            </section>
          </div>
        ) : null}
      </Modal>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AdminInlinePlayer({ track, compact = false }: { track: Track; compact?: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.durationSec || 0);
  const [volume, setVolume] = useState(0.55);

  const audioSrc = useMemo(
    () => buildApiUrl(track.audioUrl, true),
    [track.audioUrl, track.id]
  );

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(track.durationSec || 0);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.volume = 0.55;
      audio.currentTime = 0;
    }
    setVolume(0.55);
  }, [audioSrc, track.durationSec]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  async function toggleLocalPlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused || audio.ended) {
      await audio.play().catch(() => undefined);
      setIsPlaying(true);
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }

  return (
    <div className={`admin-inline-player ${track.kind === "sample" ? "sample" : "demo"} ${compact ? "compact" : ""}`}>
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || track.durationSec || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => setIsPlaying(false)}
      />
      <button className="btn icon-btn admin-inline-play" type="button" onClick={() => void toggleLocalPlay()} aria-label={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? "||" : "▶"}
      </button>
      <WaveformPreview active={isPlaying} className="admin-inline-waveform" />
      <span className="admin-inline-time">
        {formatTimestamp(currentTime)} / {duration ? formatDuration(duration) : "--"}
      </span>
      {!compact ? <span className="admin-inline-key">{track.musicalKey || "--"}</span> : null}
      {!compact ? (
        <label className="admin-inline-volume">
          Volume
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
          />
          <span>{Math.round(volume * 100)}%</span>
        </label>
      ) : null}
    </div>
  );
}
