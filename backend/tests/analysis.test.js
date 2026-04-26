const { analyzeTrackMetadata, generateAura } = require("../src/utils/analysis");

describe("audio aura generation", () => {
  test("metal demos with high energy produce an intense aura", () => {
    const aura = generateAura({
      title: "Heavy Room",
      originalFileName: "heavy-room-148bpm.wav",
      genre: "metal",
      bpm: 148,
      musicalKey: "Dm",
      energyLevel: "high",
    });

    expect(aura.primaryColor).toMatch(/^#[0-9a-f]{6}$/);
    expect(aura.gradient).toContain(aura.primaryColor);
    expect(aura.moodLabel).toBe("Intense metal aura");
  });

  test("same genre demos still get different aura palettes", () => {
    const first = generateAura({
      title: "Heavy Room",
      originalFileName: "heavy-room.wav",
      genre: "metal",
      bpm: 148,
      musicalKey: "Dm",
      energyLevel: "high",
    });
    const second = generateAura({
      title: "Red Engine",
      originalFileName: "red-engine.wav",
      genre: "metal",
      bpm: 152,
      musicalKey: "Em",
      energyLevel: "high",
    });

    expect(first.gradient).not.toBe(second.gradient);
  });

  test("metadata analysis does not guess bpm when it is not explicit", () => {
    const analysis = analyzeTrackMetadata({
      title: "Warm guitar loop",
      originalFileName: "warm-guitar-loop.wav",
      genre: "rock",
      durationSec: 12,
      kind: "sample",
      username: "producer",
    });

    expect(analysis.bpm).toBeNull();
  });

  test("metadata analysis keeps explicit bpm from the filename", () => {
    const analysis = analyzeTrackMetadata({
      title: "Warm guitar loop",
      originalFileName: "warm-guitar-loop-118bpm.wav",
      genre: "rock",
      durationSec: 12,
      kind: "sample",
      username: "producer",
    });

    expect(analysis.bpm).toBe(118);
  });
});
