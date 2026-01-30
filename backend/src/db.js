const mongoose = require("mongoose");

async function connectDb() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/prodcty";
  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);
  console.log("[db] connected:", uri);
}

module.exports = { connectDb };
