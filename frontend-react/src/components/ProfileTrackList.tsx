import type { CSSProperties } from "react";
import type { Track } from "../types";
import { buildApiUrl, formatDuration, formatFileSize, formatRating } from "../lib/format";
import { usePlayer } from "../contexts/PlayerContext";
import { TrackArtwork } from "./TrackArtwork";
import { TrackVoteControls } from "./TrackVoteControls";
import { WaveformPreview } from "./WaveformPreview";

type ProfileTrackListProps = {
  items: Track[];
  canDelete?: boolean;
  onPlay: (track: Track) => void;
  onDelete?: (trackId: string) => void;
  onVote: (trackId: string, value: 1 | -1) => void;
};

export function ProfileTrackList({
  items,
  canDelete = false,
  onPlay,
  onDelete,
  onVote,
}: ProfileTrackListProps) {
  const { currentTrack, isPlaying } = usePlayer();

  if (!items.length) {
    return <div className="empty-state">No uploads yet.</div>;
  }

  return (
    <>
      {items.map((track) => {
        const isDemo = track.kind === "demo";
        const trackIsPlaying = currentTrack?.id === track.id && isPlaying;
        return (
          <article
            key={track.id}
            className={`library-row profile-track-row ${trackIsPlaying ? "is-playing" : ""} ${isDemo ? "profile-demo-row aura-card" : "profile-sample-row"}`}
            style={
              isDemo
                ? ({
                    ["--aura-gradient" as string]: track.aura.gradient,
                    ["--aura-primary" as string]: track.aura.primaryColor,
                    ["--aura-secondary" as string]: track.aura.secondaryColor,
                    ["--aura-accent" as string]: track.aura.accentColor,
                  } as CSSProperties)
                : undefined
            }
          >
            {isDemo ? <div className="aura-preview" aria-hidden="true"></div> : null}
            <div className="library-row-main">
              <TrackArtwork label={isDemo ? "DM" : (track.genre || "SA").slice(0, 2).toUpperCase()} />
              <div className="library-row-copy">
                <h3>{track.title}</h3>
                <div className="meta-line">
                  {isDemo ? "Demo" : "Sample"} | {track.genre || "unknown"} | {formatFileSize(track.fileSize)}
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
            {isDemo ? (
              <div className={`profile-track-aura demo-aura-strip ${trackIsPlaying ? "is-playing" : ""}`}>
                <WaveformPreview active={trackIsPlaying} className="demo-aura-waveform" />
              </div>
            ) : (
              <WaveformPreview active={trackIsPlaying} className="sample-waveform-preview profile-sample-waveform" />
            )}
            <div className="track-info-pills">
              <span>{formatDuration(track.durationSec)}</span>
              <span>{track.musicalKey || "no key"}</span>
              <span>{track.bpm ? `${track.bpm} BPM` : "no BPM"}</span>
              <span>{track.energyLevel || "medium"} energy</span>
            </div>
            <div className="profile-track-rating">
              {isDemo ? formatRating(track.ratingAverage, track.ratingCount) : `${track.playCount || 0} plays`}
            </div>
            <div className={`library-row-actions compact-actions ${isDemo ? "demo-actions" : "sample-actions"}`}>
              <TrackVoteControls
                trackId={track.id}
                upvoteCount={track.upvoteCount}
                downvoteCount={track.downvoteCount}
                onVote={(value) => onVote(track.id, value)}
              />
              <button className="btn primary icon-btn" type="button" onClick={() => onPlay(track)} aria-label={trackIsPlaying ? "Pause upload" : "Play upload"}>
                {trackIsPlaying ? "||" : ">"}
              </button>
              {track.downloadUrl ? (
                <a className="btn ghost" href={buildApiUrl(track.downloadUrl)}>
                  Download
                </a>
              ) : null}
              {canDelete && onDelete ? (
                <button className="btn danger" type="button" onClick={() => onDelete(track.id)}>
                  Delete
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </>
  );
}
