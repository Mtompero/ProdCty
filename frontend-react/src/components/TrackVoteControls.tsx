import { useAuth } from "../contexts/AuthContext";

type TrackVoteControlsProps = {
  trackId: string;
  upvoteCount: number;
  downvoteCount: number;
  onVote: (value: 1 | -1) => void;
};

export function TrackVoteControls({
  trackId,
  upvoteCount,
  downvoteCount,
  onVote,
}: TrackVoteControlsProps) {
  const { user } = useAuth();

  return (
    <div className="vote-controls" aria-label={`Track ${trackId} votes`}>
      <button
        className="vote-btn"
        type="button"
        title={user ? "Upvote" : "Log in to vote"}
        onClick={() => onVote(1)}
      >
        ↑ <span>{upvoteCount}</span>
      </button>
      <button
        className="vote-btn"
        type="button"
        title={user ? "Downvote" : "Log in to vote"}
        onClick={() => onVote(-1)}
      >
        ↓ <span>{downvoteCount}</span>
      </button>
    </div>
  );
}
