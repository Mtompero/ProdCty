"use strict";

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const { connectDb } = require("../db");
const Comment = require("../models/Comment");
const Rating = require("../models/Rating");
const Track = require("../models/Track");
const TrackVote = require("../models/TrackVote");
const User = require("../models/User");
const { analyzeTrackMetadata } = require("./analysis");
const { isCloudinaryEnabled, uploadBufferToCloudinary, uploadDir } = require("./mediaStorage");

const SEED_PASSWORD = process.env.DEMO_SEED_PASSWORD || "Demo1234!";
const SAMPLE_RATE = 22050;

const seedUsers = [
  {
    username: "demo_suti",
    email: "suti@prodcty.demo",
    interests: ["rock", "metal", "indie"],
    bio: "Guitar riffs, rough mixes and punchy demo ideas.",
  },
  {
    username: "demo_mark",
    email: "mark@prodcty.demo",
    interests: ["rock", "ambient", "cinematic"],
    bio: "Layered guitar sketches and atmospheric textures.",
  },
  {
    username: "demo_indie",
    email: "asd123456@prodcty.demo",
    interests: ["indie", "lofi", "hip hop"],
    bio: "Indie loops, mellow chops and simple groove ideas.",
  },
  {
    username: "demo_gretike",
    email: "gretike@prodcty.demo",
    interests: ["drum and bass", "techno", "house"],
    bio: "Percussion-first producer collecting clean drum one-shots.",
  },
  {
    username: "demo_vityamitya",
    email: "vityamitya@prodcty.demo",
    interests: ["r&b", "soul", "reggae"],
    bio: "Warm chords, soft basslines and vocal-friendly demos.",
  },
];

const seedTracks = [
  {
    owner: "demo_suti",
    kind: "demo",
    title: "weird riff",
    genre: "rock",
    description: "Crunchy guitar demo looking for arrangement feedback.",
    bpm: 110,
    musicalKey: "A minor",
    durationSec: 36,
    frequency: 164,
  },
  {
    owner: "demo_mark",
    kind: "demo",
    title: "Strong Guitar riff",
    genre: "rock",
    description: "Work-in-progress hook with a simple drum pulse.",
    bpm: null,
    musicalKey: "",
    durationSec: 64,
    frequency: 196,
  },
  {
    owner: "demo_indie",
    kind: "demo",
    title: "beach guitar indie",
    genre: "indie",
    description: "Clean indie guitar idea, needs mix and chorus feedback.",
    bpm: 96,
    musicalKey: "",
    durationSec: 52,
    frequency: 220,
  },
  {
    owner: "demo_vityamitya",
    kind: "demo",
    title: "Guitar_haunting",
    genre: "r&b",
    description: "Soft guitar and low energy groove for vocal toplines.",
    bpm: 96,
    musicalKey: "B",
    durationSec: 58,
    frequency: 146,
  },
  {
    owner: "demo_gretike",
    kind: "sample",
    title: "Kick_muted_thickness",
    genre: "rock",
    description: "Short muted kick one-shot for rock and indie drums.",
    bpm: 128,
    musicalKey: "",
    durationSec: 1,
    extraTags: ["kick", "muted", "thickness", "one-shot", "drums"],
    frequency: 74,
  },
  {
    owner: "demo_suti",
    kind: "sample",
    title: "Vocal chop",
    genre: "unknown",
    description: "Quick vocal-style synth chop for melodic loops.",
    bpm: 128,
    musicalKey: "A#",
    durationSec: 15,
    extraTags: ["vocal", "chop", "loop"],
    frequency: 330,
  },
  {
    owner: "demo_vityamitya",
    kind: "sample",
    title: "shaker_perc",
    genre: "reggae",
    description: "Loose shaker and percussion texture.",
    bpm: null,
    musicalKey: "",
    durationSec: 5,
    extraTags: ["shaker", "perc", "drums", "one-shot"],
    frequency: 260,
  },
  {
    owner: "demo_indie",
    kind: "sample",
    title: "Snare_Fat",
    genre: "unknown",
    description: "Fat snare one-shot with a short tail.",
    bpm: null,
    musicalKey: "",
    durationSec: 1,
    extraTags: ["snare", "fat", "drums", "one-shot"],
    frequency: 186,
  },
];

const seedRatings = [
  { trackTitle: "weird riff", author: "demo_mark", score: 5, text: "Strong riff, the second half could open up with a wider rhythm guitar." },
  { trackTitle: "weird riff", author: "demo_indie", score: 4, text: "The hook works well. I would make the drums a bit tighter." },
  { trackTitle: "beach guitar indie", author: "demo_suti", score: 4, text: "Nice mood. The lead line could use a little more space." },
  { trackTitle: "Guitar_haunting", author: "demo_gretike", score: 5, text: "Warm and clean. The low end feels controlled." },
];

const seedComments = [
  { trackTitle: "weird riff", author: "demo_gretike", text: "The intro sells the idea quickly.", category: "arrangement" },
  { trackTitle: "weird riff", author: "demo_suti", text: "Thanks, I will try a second guitar layer there.", category: "general", replyToAuthor: "demo_gretike" },
  { trackTitle: "beach guitar indie", author: "demo_mark", text: "The main guitar is catchy, but the chorus needs a clearer lift.", category: "mix" },
  { trackTitle: "Guitar_haunting", author: "demo_indie", text: "This would fit a vocal feature nicely.", category: "general" },
];

function writeUInt32LE(buffer, value, offset) {
  buffer.writeUInt32LE(value, offset);
}

function writeUInt16LE(buffer, value, offset) {
  buffer.writeUInt16LE(value, offset);
}

function createWavBuffer({ durationSec, frequency, kind }) {
  const duration = Math.max(1, Number(durationSec || 1));
  const samples = Math.floor(SAMPLE_RATE * duration);
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  writeUInt32LE(buffer, 36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  writeUInt32LE(buffer, 16, 16);
  writeUInt16LE(buffer, 1, 20);
  writeUInt16LE(buffer, 1, 22);
  writeUInt32LE(buffer, SAMPLE_RATE, 24);
  writeUInt32LE(buffer, SAMPLE_RATE * 2, 28);
  writeUInt16LE(buffer, 2, 32);
  writeUInt16LE(buffer, 16, 34);
  buffer.write("data", 36);
  writeUInt32LE(buffer, dataSize, 40);

  for (let index = 0; index < samples; index += 1) {
    const time = index / SAMPLE_RATE;
    const beat = kind === "sample" ? 1 : 0.45 + 0.55 * Math.sin(2 * Math.PI * 2 * time) ** 2;
    const envelope = Math.min(1, index / (SAMPLE_RATE * 0.02)) * Math.min(1, (samples - index) / (SAMPLE_RATE * 0.08));
    const tone = Math.sin(2 * Math.PI * frequency * time) * 0.48;
    const harmonic = Math.sin(2 * Math.PI * frequency * 1.5 * time) * 0.16;
    const transient = kind === "sample" ? Math.sin(2 * Math.PI * 52 * time) * Math.exp(-time * 8) * 0.7 : 0;
    const value = Math.max(-1, Math.min(1, (tone + harmonic + transient) * beat * envelope));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
  }

  return buffer;
}

async function storeSeedAudio(track, index) {
  const originalFileName = `seed-${track.kind}-${index + 1}-${track.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.wav`;
  const buffer = createWavBuffer(track);
  const file = {
    originalname: originalFileName,
    mimetype: "audio/wav",
    size: buffer.length,
    buffer,
  };

  if (isCloudinaryEnabled()) {
    const stored = await uploadBufferToCloudinary(file, {
      folder: process.env.CLOUDINARY_AUDIO_FOLDER || "prodcty/audio",
      resourceType: "video",
    });
    return {
      originalFileName,
      mimeType: "audio/wav",
      fileSize: buffer.length,
      audioUrl: stored.url,
      storageProvider: stored.storageProvider,
      storageResourceType: stored.resourceType || "video",
      storagePath: stored.storagePath,
    };
  }

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storagePath = path.join(uploadDir, originalFileName);
  fs.writeFileSync(storagePath, buffer);

  return {
    originalFileName,
    mimeType: "audio/wav",
    fileSize: buffer.length,
    audioUrl: "",
    storageProvider: "local",
    storageResourceType: "auto",
    storagePath,
  };
}

async function removePreviousSeedData() {
  const seedEmails = seedUsers.map((user) => user.email);
  const seedUserIds = (await User.find({ email: { $in: seedEmails } }).select("_id").lean()).map((user) => String(user._id));
  const seedTracks = await Track.find({
    $or: [
      { userId: { $in: seedUserIds } },
      { originalFileName: /^seed-/ },
    ],
  }).select("_id").lean();
  const seedTrackIds = seedTracks.map((track) => track._id);

  await Promise.all([
    Comment.deleteMany({ $or: [{ userId: { $in: seedUserIds } }, { trackId: { $in: seedTrackIds } }] }),
    Rating.deleteMany({ $or: [{ userId: { $in: seedUserIds } }, { trackId: { $in: seedTrackIds } }] }),
    TrackVote.deleteMany({ $or: [{ userId: { $in: seedUserIds } }, { trackId: { $in: seedTrackIds } }] }),
    Track.deleteMany({ _id: { $in: seedTrackIds } }),
    User.deleteMany({ email: { $in: seedEmails } }),
  ]);
}

async function createUsers() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const users = new Map();

  for (const user of seedUsers) {
    const created = await User.create({
      ...user,
      passwordHash,
      role: "user",
      moderationStatus: "active",
      warningCount: 0,
      createdAt: new Date(),
    });
    users.set(created.username, created);
  }

  return users;
}

async function createTracks(users) {
  const tracks = new Map();

  for (let index = 0; index < seedTracks.length; index += 1) {
    const seedTrack = seedTracks[index];
    const owner = users.get(seedTrack.owner);
    if (!owner) continue;

    const storedAudio = await storeSeedAudio(seedTrack, index);
    const analysis = analyzeTrackMetadata({
      title: seedTrack.title,
      originalFileName: storedAudio.originalFileName,
      genre: seedTrack.genre,
      bpm: seedTrack.bpm,
      musicalKey: seedTrack.musicalKey,
      durationSec: seedTrack.durationSec,
      kind: seedTrack.kind,
      username: owner.username,
    });

    const trackId = new mongoose.Types.ObjectId();
    const tags = [...new Set([
      ...analysis.tags,
      ...(seedTrack.extraTags || []),
      seedTrack.genre,
    ].map((tag) => String(tag || "").trim().toLowerCase()).filter(Boolean))].slice(0, 20);

    const created = await Track.create({
      _id: trackId,
      userId: String(owner._id),
      username: owner.username,
      userAvatarUrl: owner.avatarUrl || "",
      title: seedTrack.title,
      kind: seedTrack.kind,
      genre: seedTrack.genre,
      tags,
      description: seedTrack.description,
      bpm: seedTrack.bpm,
      musicalKey: seedTrack.musicalKey,
      energyLevel: analysis.energyLevel,
      aura: analysis.aura,
      analysisSource: "demo-seed",
      licenseLabel: "Royalty-free demo seed",
      licenseConfirmed: seedTrack.kind === "sample",
      licenseConfirmedAt: seedTrack.kind === "sample" ? new Date() : null,
      aiRiskLevel: seedTrack.kind === "sample" ? "clear" : "unknown",
      aiRiskReasons: seedTrack.kind === "sample" ? ["Seed sample generated by ProdCty demo script."] : [],
      aiSuggestedAction: seedTrack.kind === "sample" ? "allow" : "unknown",
      aiAdminNote: seedTrack.kind === "sample" ? "Generated seed audio. No external sample pack source." : "",
      aiRiskSource: seedTrack.kind === "sample" ? "manual" : "disabled",
      aiCheckedAt: seedTrack.kind === "sample" ? new Date() : null,
      durationSec: seedTrack.durationSec,
      originalFileName: storedAudio.originalFileName,
      mimeType: storedAudio.mimeType,
      fileSize: storedAudio.fileSize,
      audioUrl: storedAudio.audioUrl || `/tracks/${trackId.toString()}/stream`,
      storageProvider: storedAudio.storageProvider,
      storageResourceType: storedAudio.storageResourceType,
      storagePath: storedAudio.storagePath,
      playCount: Math.floor(8 + index * 5),
      upvoteCount: 0,
      downvoteCount: 0,
      createdAt: new Date(Date.now() - index * 60 * 60 * 1000),
    });

    tracks.set(created.title, created);
  }

  return tracks;
}

async function createVotes(users, tracks) {
  const userList = [...users.values()];
  const trackList = [...tracks.values()];

  for (const track of trackList) {
    let upvoteCount = 0;
    let downvoteCount = 0;

    for (let index = 0; index < userList.length; index += 1) {
      const user = userList[index];
      if (String(user._id) === track.userId) continue;
      const value = (index + String(track._id).charCodeAt(0)) % 5 === 0 ? -1 : 1;
      if (value === 1) upvoteCount += 1;
      if (value === -1) downvoteCount += 1;
      await TrackVote.create({
        trackId: track._id,
        userId: String(user._id),
        value,
        updatedAt: new Date(),
      });
    }

    await Track.findByIdAndUpdate(track._id, { upvoteCount, downvoteCount });
  }
}

async function createRatingsAndComments(users, tracks) {
  for (const item of seedRatings) {
    const track = tracks.get(item.trackTitle);
    const author = users.get(item.author);
    if (!track || !author) continue;
    await Rating.create({
      trackId: track._id,
      userId: String(author._id),
      author: author.username,
      score: item.score,
      text: item.text,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  for (const track of tracks.values()) {
    if (track.kind !== "demo") continue;
    const aggregate = await Rating.aggregate([
      { $match: { trackId: track._id } },
      { $group: { _id: "$trackId", average: { $avg: "$score" }, count: { $sum: 1 } } },
    ]);
    const summary = aggregate[0] || { average: 0, count: 0 };
    await Track.findByIdAndUpdate(track._id, {
      ratingAverage: Number(Number(summary.average || 0).toFixed(1)),
      ratingCount: Number(summary.count || 0),
    });
  }

  const createdComments = [];
  for (const item of seedComments) {
    const track = tracks.get(item.trackTitle);
    const author = users.get(item.author);
    if (!track || !author) continue;

    const parent = item.replyToAuthor
      ? createdComments.find((comment) => comment.trackId === String(track._id) && comment.author === item.replyToAuthor)
      : null;

    const created = await Comment.create({
      trackId: track._id,
      parentId: parent ? parent._id : null,
      userId: String(author._id),
      author: author.username,
      category: item.category,
      text: item.text,
      createdAt: new Date(),
    });

    createdComments.push({ _id: created._id, trackId: String(track._id), author: author.username });
  }
}

async function seedDemoData() {
  await connectDb();
  await removePreviousSeedData();
  const users = await createUsers();
  const tracks = await createTracks(users);
  await createVotes(users, tracks);
  await createRatingsAndComments(users, tracks);

  console.log(`Seeded ${users.size} demo users and ${tracks.size} tracks.`);
  console.log(`Demo login password for all seeded users: ${SEED_PASSWORD}`);
}

if (require.main === module) {
  seedDemoData()
    .then(() => mongoose.disconnect())
    .catch(async (err) => {
      console.error("Demo seed failed:", err && err.message ? err.message : err);
      await mongoose.disconnect().catch(() => undefined);
      process.exit(1);
    });
}

module.exports = { seedDemoData };
