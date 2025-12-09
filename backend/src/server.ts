import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import studentRoutes from "./routes/students";
import examSessionRoutes from "./routes/examSessions";
import attendanceRoutes from "./routes/attendance";
import batchTransferRoutes from "./routes/batchTransfer";
import analyticsRoutes from "./routes/analytics";
import exportRoutes from "./routes/export";
import classAttendanceRoutes from "./routes/classAttendance";
import { cleanupBlacklistedTokens } from "./utils/cleanupBlacklistedTokens";
import { initializeSocketServer } from "./socket/socketServer";

// Load environment variables
dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 3000;

// Initialize Socket.io with authentication
export const io = initializeSocketServer(httpServer);

// Middleware
// Allow CORS from multiple origins for web and mobile development
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8081", // Expo dev server
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow any origin in development for Expo Go
      if (process.env.NODE_ENV === "development") {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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
      classAttendance: "/api/class-attendance",
      batchTransfers: "/api/batch-transfers",
      analytics: "/api/analytics",
      reports: "/api/reports/export",
    },
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/exam-sessions", examSessionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/class-attendance", classAttendanceRoutes);
app.use("/api/batch-transfers", batchTransferRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports/export", exportRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server (HTTP + Socket.io on same port)
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Network: http://192.168.43.153:${PORT}`);
  console.log(`   - Socket.io: Enabled with authentication`);
  console.log(`   (Use the Network URL for Expo Go app)`);

  // Start blacklisted token cleanup (runs every hour)
  console.log("🧹 Starting token blacklist cleanup service...");
  cleanupBlacklistedTokens(); // Run immediately on startup
  setInterval(cleanupBlacklistedTokens, 60 * 60 * 1000); // Then every hour
});
