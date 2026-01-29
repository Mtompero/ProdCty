const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const tracks = [
  { id: "1", userId: "1", title: "Beat One", createdAt: "2026-01-26T10:00:00Z" },
  { id: "2", userId: "2", title: "Guitar Jam", createdAt: "2026-01-27T12:00:00Z" },
];

const commentsByTrackId = {}; 
let nextCommentId = 1;

// health
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// feed (legfrissebb elöl)
app.get("/feed", (req, res) => {
  const sorted = [...tracks].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(sorted);
});

// profil: user saját trackjei
app.get("/profile/:userId", (req, res) => {
  const userId = req.params.userId;
  const mine = tracks.filter((t) => t.userId === userId);
  res.json(mine);
});

// kommentek listája egy trackhez
app.get("/comments/:trackId", (req, res) => {
  const trackId = req.params.trackId;
  res.json(commentsByTrackId[trackId] || []);
});

// komment létrehozás
app.post("/comments/:trackId", (req, res) => {
  const trackId = req.params.trackId;
  const text = (req.body && req.body.text) ? String(req.body.text) : "";

  const comment = {
    id: String(nextCommentId++),
    text: text,
    createdAt: new Date().toISOString(),
  };

  if (!commentsByTrackId[trackId]) commentsByTrackId[trackId] = [];
  commentsByTrackId[trackId].push(comment);

  res.json(comment);
});

app.listen(3000, () => {
  console.log("ProdCty running at http://localhost:3000");
});
