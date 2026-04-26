type TrackArtworkProps = {
  label: string;
};

export function TrackArtwork({ label }: TrackArtworkProps) {
  return <div className="library-row-art">{label}</div>;
}
