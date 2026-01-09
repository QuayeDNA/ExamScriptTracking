import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import studentRoutes from "./routes/students";
import examSessionRoutes from "./routes/examSessions";
import attendanceRoutes from "./routes/attendance";
import classAttendanceRoutes from "./routes/classAttendance";
import batchTransferRoutes from "./routes/batchTransfer";
import analyticsRoutes from "./routes/analytics";
import exportRoutes from "./routes/export";
import incidentRoutes from "./routes/incident";
import registrationRoutes from "./routes/registration";
import { cleanupBlacklistedTokens } from "./utils/cleanupBlacklistedTokens";
import { initializeSocketServer } from "./socket/socketServer";
import { templateRenderer } from "./utils/templateRenderer";

// ============================================================================
// CONFIGURATION
// ============================================================================

// Load environment variables
dotenv.config();

// Set database URL based on environment
if (process.env.NODE_ENV === "production") {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
}

const app: Express = express();

// For development, keep it simple: HTTP only
// Web frontend will use Vite proxy, mobile connects directly
const httpServer = createServer(app);

const PORT = Number(process.env.PORT) || 3000;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : [];

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8081", // Expo dev server
  ...corsOrigins,
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
        console.log(`CORS blocked origin: ${origin}`);
        console.log(`Allowed origins:`, allowedOrigins);
        callback(null, false);
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ASCII Art for EST
const getAsciiArt = () => {
  return `
╔═══════════════════════════════════════════════════╗
║                                                   ║
║             ███████╗███████╗████████╗             ║
║             ██╔════╝██╔════╝╚══██╔══╝             ║
║             █████╗  ███████╗   ██║                ║
║             ██╔══╝  ╚════██║   ██║                ║
║             ███████╗███████║   ██║                ║
║             ╚══════╝╚══════╝   ╚═╝                ║
║                                                   ║
║                      Backend                      ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
`;
};

// Landing page route
app.get("/", (req: Request, res: Response) => {
  const asciiArt = getAsciiArt();
  const serverInfo = {
    name: "ExamScriptTrack Backend API",
    version: "1.0.0",
    status: "🟢 Running",
    environment: process.env.NODE_ENV || "development",
    port: PORT,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      api: "/api",
      docs: "/api (detailed endpoints)",
    },
    features: [
      "🔐 JWT Authentication",
      "📊 Real-time Analytics",
      "📱 Mobile App Support",
      "🌐 Web Dashboard",
      "🔔 Push Notifications",
      "📋 Incident Management",
      "📈 Performance Tracking",
      "🔄 Batch Transfer System",
    ],
  };

  // Send HTML response with ASCII art
  const templateData = {
    ascii_art: asciiArt,
    version: serverInfo.version,
    environment: serverInfo.environment,
    port: serverInfo.port.toString(),
    timestamp: new Date(serverInfo.timestamp).toLocaleString(),
    features: templateRenderer.renderFeaturesList(serverInfo.features),
  };

  const html = templateRenderer.render('landing.html', templateData);
  res.send(html);
});

// Basic health check route
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Exam Logistics System (ELMS) API is running",
  });
});

// API routes placeholder
app.get("/api", (req: Request, res: Response) => {
  res.json({
    message: "Exam Logistics System (ELMS) API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      users: "/api/users",
      students: "/api/students",
      examSessions: "/api/exam-sessions",
      attendance: "/api/attendance",
      batchTransfers: "/api/batch-transfers",
      incidents: "/api/incidents",
      analytics: "/api/analytics",
      reports: "/api/reports/export",
    },
  });
});

// API Routes
// Public routes (no auth required)


// Authenticated routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/exam-sessions", examSessionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/class-attendance", classAttendanceRoutes);
app.use("/api/batch-transfers", batchTransferRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/registration", registrationRoutes);
app.use("/api/reports/export", exportRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// ============================================================================
// SOCKET.IO INITIALIZATION
// ============================================================================

// Initialize Socket.io server
const io = initializeSocketServer(httpServer, allowedOrigins);

// Export io instance for use in other modules
export { io };

// Start server (HTTP + Socket.io on same port)
httpServer.listen(PORT, "0.0.0.0", () => {
  const startupBanner = `
╔═══════════════════════════════════════════════════╗
║                                                   ║
║             ███████╗███████╗████████╗             ║
║             ██╔════╝██╔════╝╚══██╔══╝             ║
║             █████╗  ███████╗   ██║                ║
║             ██╔══╝  ╚════██║   ██║                ║
║             ███████╗███████║   ██║                ║
║             ╚══════╝╚══════╝   ╚═╝                ║
║                                                   ║
║                      Backend                      ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
`;

  console.log("\x1b[36m%s\x1b[0m", startupBanner);
  console.log(
    "\x1b[32m%s\x1b[0m",
    "╔══════════════════════════════════════════════╗"
  );
  console.log(
    "\x1b[32m%s\x1b[0m",
    "║      🚀 SERVER STARTUP COMPLETE              ║"
  );
  console.log(
    "\x1b[32m%s\x1b[0m",
    "╚══════════════════════════════════════════════╝"
  );
  console.log("");
  console.log("\x1b[36m📡 Server URLs:\x1b[0m");
  console.log("\x1b[33m   • Local:\x1b[0m      http://localhost:" + PORT);
  console.log("\x1b[33m   • Network:\x1b[0m    http://192.168.43.153:" + PORT);
  console.log("\x1b[33m   • Landing:\x1b[0m    http://localhost:" + PORT + "/");
  console.log("");
  console.log("\x1b[35m🔧 Services Status:\x1b[0m");
  console.log("\x1b[32m   ✓ HTTP Server\x1b[0m");
  console.log("\x1b[32m   ✓ Socket.io\x1b[0m (with authentication)");
  console.log("\x1b[32m   ✓ CORS\x1b[0m (configured for web & mobile)");
  console.log("\x1b[32m   ✓ Static Files\x1b[0m (/uploads)");
  console.log("\x1b[32m   ✓ Token Cleanup\x1b[0m (hourly)");
  console.log("");
  console.log("\x1b[34m📱 Mobile Development:\x1b[0m");
  console.log(
    "\x1b[37m   Use the Network URL for Expo Go app connections\x1b[0m"
  );
  console.log("");
  console.log("\x1b[33m🧹 Starting token blacklist cleanup service...\x1b[0m");

  // Start blacklisted token cleanup (runs every hour)
  cleanupBlacklistedTokens(); // Run immediately on startup
  setInterval(cleanupBlacklistedTokens, 60 * 60 * 1000); // Then every hour
});
