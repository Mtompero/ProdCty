import { useEffect, useMemo, useState } from "react";
import { fetchTrack, fetchTracks, reportTrack, uploadTrack, voteTrack } from "../lib/api";
import { buildApiUrl, formatDuration, formatFileSize } from "../lib/format";
import { AUDIO_DURATION_LIMITS_SEC, buildTrackUploadFormData, validateAudioDuration } from "../lib/upload";
import { INTEREST_OPTIONS, formatInterestLabel, normalizeInterestList } from "../lib/interests";
import { useAuth } from "../contexts/AuthContext";
import { usePlayer } from "../contexts/PlayerContext";
import type { Track } from "../types";
import { InterestPicker } from "../components/InterestPicker";
import { Modal } from "../components/Modal";
import { TrackVoteControls } from "../components/TrackVoteControls";
import { WaveformPreview } from "../components/WaveformPreview";
import { Link, useNavigate } from "react-router-dom";

const DRUM_OPTIONS = ["kick", "snare", "hihat", "clap", "rim", "perc", "tom", "cymbal"];
const TYPE_OPTIONS = ["one-shot", "loop"];
const POPULAR_SEARCH_SUGGESTIONS = ["drums", "hip hop", "vocal", "kick", "snare", "hihat", "lofi", "rock"];
const QUICK_FILTER_TAGS = [
  "drums",
  "hip hop",
  "trap",
  "soul",
  "percussion",
  "hihat",
  "snare",
  "kick",
  "vocal",
  "lofi",
  "rock",
  "house",
  "ambient",
  "one-shot",
  "loop",
];
const BASE_SEARCH_SUGGESTIONS = [
  "vocal",
  "vocals",
  "vocal chop",
  "drum loop",
  "kick",
  "snare",
  "hihat",
  "808",
  "ambient texture",
  "lofi sample",
  "rock drums",
  "metal riff",
];

export function LibraryPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, toggleTrack } = usePlayer();
  const [samples, setSamples] = useState<Track[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [licenseConfirmOpen, setLicenseConfirmOpen] = useState(false);
  const [pendingUploadFormData, setPendingUploadFormData] = useState<FormData | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTrackItem, setReportTrackItem] = useState<Track | null>(null);
  const [reportMessage, setReportMessage] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    genre: "",
    key: "",
    bpmRange: "",
    energy: "",
    drumType: "",
    sampleType: "",
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchInteracted, setSearchInteracted] = useState(false);
  const [searchSuggestionsOpen, setSearchSuggestionsOpen] = useState(false);

  const filterQuery = useMemo(() => {
    const params = new URLSearchParams({ kind: "sample", limit: "48" });
    if (filters.q) params.set("q", filters.q);
    if (filters.genre) params.set("genre", filters.genre);
    if (filters.key) params.set("key", filters.key);
    if (filters.energy) params.set("energy", filters.energy);
    if (filters.bpmRange) {
      const [min, max] = filters.bpmRange.split("-");
      if (min) params.set("bpmMin", min);
      if (max) params.set("bpmMax", max);
    }
    const tags = [filters.drumType, filters.sampleType].filter(Boolean);
    if (tags.length) params.set("tags", tags.join(","));
    return params.toString();
  }, [filters]);

  async function loadSamples() {
    const result = await fetchTracks(filterQuery);
    setSamples(result.data?.items || []);
  }

  useEffect(() => {
    void loadSamples();
  }, [filterQuery]);

  useEffect(() => {
    const query = filters.q.trim().toLowerCase();
    if (!searchInteracted) {
      setSuggestions([]);
      setSearchSuggestionsOpen(false);
      return;
    }

    if (!query.length) {
      setSuggestions(POPULAR_SEARCH_SUGGESTIONS);
      setSearchSuggestionsOpen(true);
      return;
    }

    const dynamic = samples.flatMap((track) => [track.title, track.username, track.genre, ...track.tags]);
    const all = [...new Set([...BASE_SEARCH_SUGGESTIONS, ...INTEREST_OPTIONS, ...dynamic])]
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 8);
    setSuggestions(all);
    setSearchSuggestionsOpen(true);
  }, [filters.q, samples, searchInteracted]);

  async function handleVote(trackId: string, value: 1 | -1) {
    if (!token) {
      window.alert("You need to log in before voting.");
      return;
    }
    await voteTrack(token, trackId, value);
    await loadSamples();
  }

  async function handlePlay(trackId: string) {
    const result = await fetchTrack(trackId);
    if (result.data) {
      await toggleTrack(result.data);
    }
  }

  async function prepareUpload(formData: FormData) {
    if (!token || !uploadFile) {
      setUploadMessage("Choose a file and log in first.");
      return;
    }

    const durationCheck = await validateAudioDuration(uploadFile, "sample");
    if (!durationCheck.ok) {
      setUploadMessage(durationCheck.message);
      return;
    }

    setUploadMessage("");
    setPendingUploadFormData(formData);
    setLicenseConfirmOpen(true);
  }

  function closeLicenseConfirm() {
    setLicenseConfirmOpen(false);
    setPendingUploadFormData(null);
  }

  async function handleUpload(formData: FormData) {
    if (!token || !uploadFile) {
      setUploadMessage("Choose a file and log in first.");
      return;
    }

    const tags = [...selectedGenres];
    const drumType = String(formData.get("drumType") || "");
    const sampleType = String(formData.get("sampleType") || "");
    if (drumType) tags.push(drumType);
    if (sampleType) tags.push(sampleType);

    const payload = await buildTrackUploadFormData(
      uploadFile,
      {
        title: String(formData.get("title") || ""),
        genre: selectedGenres.join(","),
        bpm: String(formData.get("bpm") || ""),
        musicalKey: String(formData.get("musicalKey") || ""),
        description: String(formData.get("description") || ""),
        tags: normalizeInterestList(tags).join(","),
      },
      "sample"
    );
    payload.set("licenseConfirmed", "true");

    const result = await uploadTrack(token, payload);
    if (!result.ok) {
      setUploadMessage(result.errorMessage);
      return;
    }

    setUploadMessage("Sample uploaded.");
    setLicenseConfirmOpen(false);
    setPendingUploadFormData(null);
    setUploadOpen(false);
    setUploadFile(null);
    setSelectedGenres([]);
    await loadSamples();
    if (result.data) {
      await toggleTrack(result.data);
    }
  }

  async function handleReport(formData: FormData) {
    if (!token || !reportTrackItem) {
      setReportMessage("Choose a sample and log in first.");
      return;
    }

    const result = await reportTrack(token, reportTrackItem.id, {
      reason: String(formData.get("reason") || "copyright"),
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

  function applyQuickFilter(tag: string) {
    if (DRUM_OPTIONS.includes(tag)) {
      setFilters((prev) => ({ ...prev, drumType: prev.drumType === tag ? "" : tag }));
      return;
    }

    if (TYPE_OPTIONS.includes(tag)) {
      setFilters((prev) => ({ ...prev, sampleType: prev.sampleType === tag ? "" : tag }));
      return;
    }

    setFilters((prev) => ({ ...prev, q: prev.q === tag ? "" : tag }));
  }

  function openUploadSample() {
    if (!token) {
      navigate("/login");
      return;
    }
    setUploadOpen(true);
  }

  useEffect(() => {
    function handleHeaderUpload(event: Event) {
      const detail = (event as CustomEvent<{ kind?: string }>).detail;
      if (detail?.kind === "sample") {
        openUploadSample();
      }
    }

    window.addEventListener("prodcty:open-upload", handleHeaderUpload);
    return () => window.removeEventListener("prodcty:open-upload", handleHeaderUpload);
  }, [token]);

  return (
    <main className="page-shell app-shell">
      <section className="app-layout library-page-layout">
        <aside className="app-column app-sidebar" aria-hidden="true"></aside>

        <section className="app-column app-main">
          <section className="hero compact app-hero">
            <div>
              <p className="eyebrow">Discover + play + download</p>
              <h1>Browse a clean audio library built for producers.</h1>
              <p className="hero-copy">
                Find loops, textures and sample ideas, then keep playback running in the bottom player.
              </p>
            </div>
          </section>

          <section className="surface-block">
            <div className="panel-header row-between">
              <div>
                <h2>Samples</h2>
                <p className="muted">Browse all uploaded samples.</p>
              </div>
              <button className="btn subtle" onClick={() => void loadSamples()}>
                Refresh
              </button>
            </div>

            <div className="splice-filter">
              <div className="library-tabs">
                <button className="active" type="button">Samples</button>
              </div>
              <div className="library-search-row">
                <div className="search-suggest-wrap">
                  <input
                    value={filters.q}
                    onChange={(event) => {
                      setSearchInteracted(true);
                      setSearchSuggestionsOpen(true);
                      setFilters((prev) => ({ ...prev, q: event.target.value }));
                    }}
                    onFocus={() => {
                      if (searchInteracted && suggestions.length) {
                        setSearchSuggestionsOpen(true);
                      }
                    }}
                    onBlur={() => window.setTimeout(() => setSearchSuggestionsOpen(false), 120)}
                    placeholder="Search samples, creators or tags"
                  />
                  {suggestions.length && searchSuggestionsOpen ? (
                    <div className="search-suggestions open">
                      {suggestions.map((item) => (
                        <button
                          key={item}
                          className="search-suggestion-item"
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setFilters((prev) => ({ ...prev, q: item }));
                            setSearchSuggestionsOpen(false);
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="filter-toolbar">
                <label className="filter-select">
                  Genre
                  <select value={filters.genre} onChange={(event) => setFilters((prev) => ({ ...prev, genre: event.target.value }))}>
                    <option value="">All genres</option>
                    {INTEREST_OPTIONS.map((genre) => (
                      <option key={genre} value={genre}>
                        {formatInterestLabel(genre)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="filter-select">
                  Key
                  <input value={filters.key} onChange={(event) => setFilters((prev) => ({ ...prev, key: event.target.value }))} placeholder="Any key" />
                </label>
                <label className="filter-select">
                  BPM
                  <select value={filters.bpmRange} onChange={(event) => setFilters((prev) => ({ ...prev, bpmRange: event.target.value }))}>
                    <option value="">Any BPM</option>
                    <option value="60-90">60-90</option>
                    <option value="90-110">90-110</option>
                    <option value="110-130">110-130</option>
                    <option value="130-160">130-160</option>
                    <option value="160-220">160+</option>
                  </select>
                </label>
                <label className="filter-select">
                  Energy
                  <select value={filters.energy} onChange={(event) => setFilters((prev) => ({ ...prev, energy: event.target.value }))}>
                    <option value="">Any energy</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label className="filter-select">
                  Drums
                  <select value={filters.drumType} onChange={(event) => setFilters((prev) => ({ ...prev, drumType: event.target.value }))}>
                    <option value="">Any drums</option>
                    {DRUM_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {formatInterestLabel(item)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="filter-select">
                  Type
                  <select value={filters.sampleType} onChange={(event) => setFilters((prev) => ({ ...prev, sampleType: event.target.value }))}>
                    <option value="">Any type</option>
                    {TYPE_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {formatInterestLabel(item)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="quick-filter-row" aria-label="Quick sample filters">
                {QUICK_FILTER_TAGS.map((tag) => {
                  const active = filters.q === tag || filters.drumType === tag || filters.sampleType === tag;
                  return (
                    <button
                      key={tag}
                      className={active ? "quick-filter-chip active" : "quick-filter-chip"}
                      type="button"
                      onClick={() => applyQuickFilter(tag)}
                    >
                      {formatInterestLabel(tag)}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="surface-block">
            <div className="library-list-head">
              <span>Sound</span>
              <span>Preview</span>
              <span>Length</span>
              <span>Key</span>
              <span>BPM</span>
              <span>Actions</span>
            </div>
            <div className="library-list">
              {samples.length ? (
                samples.map((track) => {
                  const trackIsPlaying = currentTrack?.id === track.id && isPlaying;
                  return (
                  <article key={track.id} className={`library-row sample-row ${trackIsPlaying ? "is-playing" : ""}`}>
                    <div className="library-row-main">
                      <div className="library-row-art">{(track.genre || "fx").slice(0, 2).toUpperCase()}</div>
                      <div className="library-row-copy">
                        <h3>{track.title}</h3>
                        <div className="meta-line">
                          <Link className="user-link" to={`/profile/${track.userId}`}>
                            {track.username}
                          </Link>{" "}
                          | {track.genre} | {formatFileSize(track.fileSize)}
                        </div>
                        <div className="library-row-tags">
                          {track.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="tag-pill">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <WaveformPreview active={trackIsPlaying} className="sample-waveform-preview" />
                    <div className="library-row-stat">{formatDuration(track.durationSec)}</div>
                    <div className="library-row-stat">{track.musicalKey || "--"}</div>
                    <div className="library-row-stat">{track.bpm || "--"}</div>
                    <div className="library-row-actions sample-actions">
                      <TrackVoteControls
                        trackId={track.id}
                        upvoteCount={track.upvoteCount}
                        downvoteCount={track.downvoteCount}
                        onVote={(value) => void handleVote(track.id, value)}
                      />
                      <button className="btn primary icon-btn" type="button" onClick={() => void handlePlay(track.id)} aria-label={trackIsPlaying ? "Pause sample" : "Play sample"}>
                        {trackIsPlaying ? "||" : "▶"}
                      </button>
                      {track.downloadUrl ? (
                        <a className="btn ghost small" href={buildApiUrl(track.downloadUrl)}>
                          Download
                        </a>
                      ) : null}
                      {track.userId !== user?.id ? (
                        <button
                          className="btn ghost small"
                          type="button"
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
                <div className="empty-state">No samples uploaded yet.</div>
              )}
            </div>
          </section>
        </section>

        <aside className="app-column app-rail">
          <section className="surface-block">
            <div className="panel-header">
              <h2>Overview</h2>
              <p className="muted">Live library counters.</p>
            </div>
            <div className="rail-stats">
              <div className="stat-card">
                <span>Samples</span>
                <strong>{samples.length}</strong>
              </div>
              <div className="stat-card">
                <span>Genres</span>
                <strong>{new Set(samples.map((item) => item.genre || "unknown")).size}</strong>
              </div>
              <div className="stat-card">
                <span>Auto analysis</span>
                <strong>{samples.filter((item) => item.analysisSource && item.analysisSource !== "manual").length}</strong>
              </div>
            </div>
          </section>
        </aside>
      </section>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        header={
          <div className="panel-header row-between">
            <div>
              <h2>Upload sample</h2>
              <p className="muted">Add audio first, then tag it for the library.</p>
            </div>
            <button className="btn ghost" type="button" onClick={() => setUploadOpen(false)}>
              Close
            </button>
          </div>
        }
      >
        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            void prepareUpload(new FormData(event.currentTarget));
          }}
        >
          <label>
            Audio file
            <input
              type="file"
              accept="audio/*"
              required
              onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
            />
          </label>
          <div className="field-hint">
            {uploadFile ? `${uploadFile.name} | ${formatFileSize(uploadFile.size)}` : `No audio file selected. Max length: ${AUDIO_DURATION_LIMITS_SEC.sample} seconds.`}
          </div>
          <label>
            Title
            <input name="title" placeholder="Dusty Vinyl Loop" required />
          </label>
          <div className="field-group">
            <span className="field-label">Genres (max 3)</span>
            <InterestPicker options={INTEREST_OPTIONS} selected={selectedGenres} onChange={setSelectedGenres} maxSelected={3} />
          </div>
          <label>
            BPM
            <input name="bpm" type="number" min="1" max="400" placeholder="Optional" />
          </label>
          <label>
            Key
            <input name="musicalKey" placeholder="Am" />
          </label>
          <label>
            Drum type
            <select name="drumType">
              <option value="">Not a drum sample</option>
              {DRUM_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {formatInterestLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sample type
            <select name="sampleType">
              <option value="">Any type</option>
              {TYPE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {formatInterestLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Description
            <textarea name="description" rows={4} placeholder="Dusty tape loop, vinyl noise, warm bass texture." />
          </label>
          <button className="btn primary" type="submit">
            Upload sample
          </button>
          {uploadMessage ? <div className={`msg ${uploadMessage.includes("uploaded") ? "ok" : "err"}`}>{uploadMessage}</div> : null}
        </form>
      </Modal>

      <Modal
        open={licenseConfirmOpen}
        onClose={closeLicenseConfirm}
        panelClassName="legal-confirm-dialog-panel"
        header={
          <div className="panel-header row-between">
            <div>
              <p className="eyebrow">License confirmation</p>
              <h2>Confirm sample rights</h2>
            </div>
            <button className="btn ghost" type="button" onClick={closeLicenseConfirm}>
              Back
            </button>
          </div>
        }
      >
        <div className="legal-confirm-card">
          <p>
            Before publishing this sample, confirm that you own it or have permission to share it as royalty-free content in the ProdCty library.
          </p>
          <ul>
            <li>The sample must be your own recording, your own production, or content you are allowed to redistribute.</li>
            <li>Do not upload copyrighted songs, ripped YouTube audio, paid packs, or unclear third-party material.</li>
            <li>If a sample is reported, an admin can review it and remove it from the library.</li>
          </ul>
        </div>
        <div className="dialog-actions">
          <button className="btn subtle" type="button" onClick={closeLicenseConfirm}>
            Cancel
          </button>
          <button
            className="btn primary"
            type="button"
            onClick={() => {
              if (pendingUploadFormData) {
                void handleUpload(pendingUploadFormData);
              }
            }}
          >
            Confirm and upload
          </button>
        </div>
      </Modal>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        header={
          <div className="panel-header row-between">
            <div>
              <p className="eyebrow">Report sample</p>
              <h2>{reportTrackItem?.title || "Selected sample"}</h2>
              <p className="muted">Flag license concerns, spam or unwanted downloadable content for admin review.</p>
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
            <select name="reason" defaultValue="copyright">
              <option value="copyright">License / copyright concern</option>
              <option value="spam">Spam or unwanted content</option>
              <option value="misleading">Misleading metadata</option>
              <option value="explicit">Explicit or unsafe content</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Details
            <textarea name="details" rows={4} placeholder="Explain why the sample may not be valid, royalty-free or appropriate." />
          </label>
          <button className="btn primary" type="submit">
            Send report
          </button>
          {reportMessage ? <div className={`msg ${reportMessage.includes("sent") ? "ok" : "err"}`}>{reportMessage}</div> : null}
        </form>
      </Modal>
    </main>
  );
}
