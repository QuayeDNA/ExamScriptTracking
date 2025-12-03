import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import studentRoutes from "./routes/students";
import examSessionRoutes from "./routes/examSessions";
import attendanceRoutes from "./routes/attendance";
import batchTransferRoutes from "./routes/batchTransfer";
import { cleanupBlacklistedTokens } from "./utils/cleanupBlacklistedTokens";

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;
const SOCKET_PORT = process.env.SOCKET_PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Exam Script Tracking API is running" });
});

// API routes placeholder
app.get("/api", (req: Request, res: Response) => {
  res.json({
    message: "Exam Script Tracking API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      users: "/api/users",
      students: "/api/students",
      examSessions: "/api/exam-sessions",
      attendance: "/api/attendance",
      batchTransfers: "/api/batch-transfers",
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/exam-sessions", examSessionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/batch-transfers", batchTransferRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Create HTTP server for Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`✅ Express server running on http://localhost:${PORT}`);

  // Start blacklisted token cleanup (runs every hour)
  console.log("🧹 Starting token blacklist cleanup service...");
  cleanupBlacklistedTokens(); // Run immediately on startup
  setInterval(cleanupBlacklistedTokens, 60 * 60 * 1000); // Then every hour
});

// Start Socket.io server
httpServer.listen(SOCKET_PORT, () => {
  console.log(`✅ Socket.io server running on http://localhost:${SOCKET_PORT}`);
});
