function validateTrack(track) {
  if (!track) return false;

  const titleOk = typeof track.title === "string" && track.title.trim().length > 0;
  const lengthOk = typeof track.lengthSec === "number" && track.lengthSec > 0;

  return titleOk && lengthOk;
}

function addTrack(tracks, track) {
  if (!Array.isArray(tracks)) throw new Error("tracks must be an array");
  if (!validateTrack(track)) throw new Error("Invalid track");

  const newTrack = {
    id: tracks.length + 1,
    ...track,
  };

  tracks.push(newTrack);
  return tracks;
}

function filterByGenre(tracks, genre) {
  if (!Array.isArray(tracks)) throw new Error("tracks must be an array");
  return tracks.filter((t) => t.genre === genre);
}

module.exports = {
  validateTrack,
  addTrack,
  filterByGenre,
};
