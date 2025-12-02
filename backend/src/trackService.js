function validateTrack(track) {
  if (!track) return false;
  if (typeof track.title !== 'string' || track.title.trim() === '') return false;
  if (typeof track.genre !== 'string' || track.genre.trim() === '') return false;
  if (typeof track.lengthSec !== 'number' || track.lengthSec <= 0) return false;
  return true;
}

function addTrack(tracks, track) {
  if (!validateTrack(track)) {
    throw new Error('Invalid track');
  }
  return [...tracks, { ...track, id: tracks.length + 1 }];
}

function filterByGenre(tracks, genre) {
  return tracks.filter(t => t.genre === genre);
}

module.exports = {
  validateTrack,
  addTrack,
  filterByGenre
};
