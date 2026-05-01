"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../src/utils/audioStorage", () => ({
  ensureUploadDir: jest.fn(),
  createAudioUploadMiddleware: () => ({
    single: () => (req, res, next) => next(),
  }),
  getStoredAudioMeta: jest.fn(),
  removeStoredFile: jest.fn(),
}));

jest.mock("../src/utils/mediaStorage", () => ({
  createImageUploadMiddleware: () => ({
    single: () => (req, res, next) => next(),
  }),
  getStoredImageMeta: jest.fn(),
  removeStoredFile: jest.fn(),
}));

jest.mock("../src/models/User", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../src/models/CollabRequest", () => ({
  deleteMany: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

jest.mock("../src/models/Track", () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
  deleteMany: jest.fn(),
}));

jest.mock("../src/models/Rating", () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
  findOneAndUpdate: jest.fn(),
  aggregate: jest.fn(),
  deleteMany: jest.fn(),
}));

jest.mock("../src/models/Report", () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  deleteMany: jest.fn(),
}));

jest.mock("../src/models/Comment", () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  deleteMany: jest.fn(),
}));

jest.mock("../src/models/TrackVote", () => ({
  aggregate: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
  deleteMany: jest.fn(),
}));

const User = require("../src/models/User");
const Track = require("../src/models/Track");
const Rating = require("../src/models/Rating");
const Comment = require("../src/models/Comment");
const Report = require("../src/models/Report");
const { createApp } = require("../src/app");

function chainableFind(result) {
  return {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
  };
}

describe("app routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret-123456";
  });

  test("public user search omits email addresses", async () => {
    User.find.mockReturnValueOnce(chainableFind([
      {
        _id: "u1",
        username: "garazsjozsi",
        email: "private@example.com",
        interests: ["rock"],
        bio: "bio",
        avatarUrl: "/users/u1/avatar",
        createdAt: "2026-04-24T10:00:00.000Z",
      },
    ]));

    const app = createApp();
    const response = await request(app).get("/users/search?q=gar");

    expect(response.status).toBe(200);
    expect(response.body[0].email).toBeUndefined();
    expect(response.body[0].username).toBe("garazsjozsi");
  });

  test("current user endpoint still returns private email data", async () => {
    const token = jwt.sign(
      { sub: "u1", username: "garazsjozsi", email: "private@example.com" },
      process.env.JWT_SECRET
    );
    User.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue({
        _id: "u1",
        username: "garazsjozsi",
        email: "private@example.com",
        interests: ["rock"],
        bio: "",
        avatarUrl: "",
        createdAt: "2026-04-24T10:00:00.000Z",
      }),
    });

    const app = createApp();
    const response = await request(app)
      .get("/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("private@example.com");
  });

  test("track detail no longer increments play count", async () => {
    Track.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue({
        _id: "507f191e810c19729de860ea",
        userId: "u1",
        username: "garazsjozsi",
        title: "Pingpong",
        kind: "demo",
        genre: "ambient",
        tags: [],
        audioUrl: "/tracks/507f191e810c19729de860ea/stream",
        storagePath: "C:\\temp\\pingpong.wav",
        originalFileName: "pingpong.wav",
        mimeType: "audio/wav",
        fileSize: 1024,
        playCount: 7,
        createdAt: new Date("2026-04-24T10:00:00.000Z"),
      }),
    });

    const app = createApp();
    const response = await request(app).get("/tracks/507f191e810c19729de860ea");

    expect(response.status).toBe(200);
    expect(Track.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(response.body.playCount).toBe(7);
  });

  test("play endpoint increments play count explicitly", async () => {
    Track.findByIdAndUpdate.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue({
        _id: "507f191e810c19729de860ea",
        playCount: 8,
      }),
    });

    const app = createApp();
    const response = await request(app).post("/tracks/507f191e810c19729de860ea/play");

    expect(response.status).toBe(200);
    expect(Track.findByIdAndUpdate).toHaveBeenCalledWith(
      "507f191e810c19729de860ea",
      { $inc: { playCount: 1 } },
      { new: true }
    );
    expect(response.body.playCount).toBe(8);
  });

  test("register enforces stronger password validation", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/auth/register")
      .send({
        username: "garazsjozsi",
        email: "garazs@example.com",
        password: "1234567",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain("at least 8");
  });

  test("demos endpoint returns paginated payload", async () => {
    Track.countDocuments.mockResolvedValueOnce(1);
    Track.find.mockReturnValueOnce(chainableFind([
      {
        _id: "507f191e810c19729de860ea",
        userId: "u1",
        username: "garazsjozsi",
        title: "Pingpong",
        kind: "demo",
        genre: "ambient",
        tags: [],
        audioUrl: "/tracks/507f191e810c19729de860ea/stream",
        storagePath: "C:\\temp\\pingpong.wav",
        originalFileName: "pingpong.wav",
        mimeType: "audio/wav",
        fileSize: 1024,
        playCount: 7,
        createdAt: new Date("2026-04-24T10:00:00.000Z"),
      },
    ]));

    const app = createApp();
    const response = await request(app).get("/demos?limit=12&page=1&sort=upvotes");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.meta).toMatchObject({ total: 1, page: 1, limit: 12, pages: 1 });
  });

  test("admin overview rejects a non-admin token", async () => {
    const token = jwt.sign(
      { sub: "u1", username: "listener", email: "listener@example.com", role: "user" },
      process.env.JWT_SECRET
    );

    const app = createApp();
    const response = await request(app)
      .get("/admin/overview")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  test("admin overview returns moderation statistics for admins", async () => {
    const token = jwt.sign(
      { sub: "admin1", username: "admin", email: "admin@admin.com", role: "admin" },
      process.env.JWT_SECRET
    );

    User.countDocuments.mockResolvedValueOnce(3);
    Track.countDocuments.mockResolvedValueOnce(4);
    Track.countDocuments.mockResolvedValueOnce(2);
    Comment.countDocuments.mockResolvedValueOnce(5);
    Rating.countDocuments.mockResolvedValueOnce(6);
    Report.countDocuments.mockResolvedValueOnce(2);
    Track.aggregate.mockResolvedValueOnce([
      {
        totalPlays: 18,
        totalUpvotes: 7,
        totalDownvotes: 1,
      },
    ]);

    const app = createApp();
    const response = await request(app)
      .get("/admin/overview")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      userCount: 3,
      sampleCount: 4,
      demoCount: 2,
      commentCount: 5,
      ratingCount: 6,
      openReportCount: 2,
      totalPlays: 18,
      totalUpvotes: 7,
      totalDownvotes: 1,
    });
  });

  test("second admin warning automatically bans the user", async () => {
    const token = jwt.sign(
      { sub: "admin1", username: "admin", email: "admin@admin.com", role: "admin" },
      process.env.JWT_SECRET
    );
    const save = jest.fn().mockResolvedValue(undefined);
    User.findById.mockResolvedValueOnce({
      _id: "u2",
      username: "repeat-offender",
      email: "repeat@example.com",
      role: "user",
      moderationStatus: "warned",
      warningCount: 1,
      moderationReason: "First warning.",
      interests: [],
      avatarUrl: "",
      createdAt: "2026-04-24T10:00:00.000Z",
      save,
    });

    const app = createApp();
    const response = await request(app)
      .patch("/admin/users/u2/moderation")
      .set("Authorization", `Bearer ${token}`)
      .send({ action: "warn", reason: "Second warning." });

    expect(response.status).toBe(200);
    expect(response.body.user.moderationStatus).toBe("banned");
    expect(response.body.user.warningCount).toBe(2);
    expect(save).toHaveBeenCalled();
  });

  test("admin moderation rejects self moderation before loading a user", async () => {
    const token = jwt.sign(
      { sub: "admin1", username: "admin", email: "admin@admin.com", role: "admin" },
      process.env.JWT_SECRET
    );

    const app = createApp();
    const response = await request(app)
      .patch("/admin/users/admin1/moderation")
      .set("Authorization", `Bearer ${token}`)
      .send({ action: "warn", reason: "Self warning should not be allowed." });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(User.findById).not.toHaveBeenCalled();
  });

  test("admin moderation rejects other admin accounts", async () => {
    const token = jwt.sign(
      { sub: "admin1", username: "admin", email: "admin@admin.com", role: "admin" },
      process.env.JWT_SECRET
    );
    User.findById.mockResolvedValueOnce({
      _id: "admin2",
      username: "other-admin",
      email: "other-admin@example.com",
      role: "admin",
    });

    const app = createApp();
    const response = await request(app)
      .patch("/admin/users/admin2/moderation")
      .set("Authorization", `Bearer ${token}`)
      .send({ action: "warn", reason: "Admin warning should not be allowed." });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
