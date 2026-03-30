const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const server = require("./app"); // ملف Express app بتاعك

const initSocket = require("./socket/socket");

dotenv.config();

const app = express();
const server = http.createServer(app); // ← needed for Socket.io

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "*", // change to your frontend URL in production
    methods: ["GET", "POST"],
  },
});

// Make io accessible in controllers via req.app.get("io")
app.set("io", io);
initSocket(io);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/messages", require("./routes/message.routes"));
app.use("/api/groups", require("./routes/group.routes"));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ message: "Chat API is running 🚀" }));

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

// ─── DB + Server ──────────────────────────────────────────────────────────────
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

// Export function compatible with Vercel
module.exports = async (req, res) => {
  await connectDB();
  server(req, res);
};

