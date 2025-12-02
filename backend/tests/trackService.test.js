const { validateTrack, addTrack, filterByGenre } = require('../src/trackService');

describe('trackService', () => {
  const validTrack = { title: 'Lo-fi beat', genre: 'lofi', lengthSec: 90 };

  test('valid track passes validation', () => {
    expect(validateTrack(validTrack)).toBe(true);
  });

  test('track with empty title is invalid', () => {
    const t = { ...validTrack, title: '' };
    expect(validateTrack(t)).toBe(false);
  });

  test('track with non-positive length is invalid', () => {
    const t = { ...validTrack, lengthSec: 0 };
    expect(validateTrack(t)).toBe(false);
  });

  test('addTrack adds a new track with id', () => {
    const result = addTrack([], validTrack);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ title: 'Lo-fi beat', genre: 'lofi' });
    expect(result[0].id).toBe(1);
  });

  test('addTrack throws on invalid track', () => {
    const bad = { title: '', genre: 'lofi', lengthSec: 50 };
    expect(() => addTrack([], bad)).toThrow('Invalid track');
  });

  test('filterByGenre returns only matching tracks', () => {
    const tracks = [
      validTrack,
      { title: 'Rock', genre: 'rock', lengthSec: 120 }
    ];
    const res = filterByGenre(tracks, 'lofi');
    expect(res).toHaveLength(1);
    expect(res[0].genre).toBe('lofi');
  });
});
