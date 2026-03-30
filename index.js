// api/index.js
const mongoose = require("mongoose");
const app = require("../app");

let isConnected = false; // لتجنب إعادة الاتصال في كل request

const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
    isConnected = true;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
};

// Serverless function لـ Vercel
module.exports = async (req, res) => {
  await connectDB();
  app(req, res);
};