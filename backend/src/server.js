"use strict";

require("dotenv").config();

const { createApp } = require("./app");
const { connectDb } = require("./db");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function start() {
  try {
    await connectDb();
    const app = createApp();

    app.listen(PORT, () => {
      console.log(`ProdCty running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("DB connect error:", err && err.message ? err.message : err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { start };
