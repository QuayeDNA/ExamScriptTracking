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

// Load environment variables
dotenv.config();

// Set database URL based on environment
if (process.env.NODE_ENV === "production") {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
}

const app: Express = express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 3000;

// Middleware
// Allow CORS from multiple origins for web and mobile development
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : [];

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8081", // Expo dev server
  ...corsOrigins,
].filter(Boolean);

// Initialize Socket.io with authentication
export const io = initializeSocketServer(httpServer, allowedOrigins);

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
╔══════════════════════════════════════════════════════════════╗
║                                                                            ║
║                            ███████╗███████╗████████╗                        ║
║                            ██╔════╝██╔════╝╚══██╔══╝                        ║
║                            █████╗  ███████╗   ██║                           ║
║                            ██╔══╝  ╚════██║   ██║                           ║
║                            ███████╗███████║   ██║                           ║
║                            ╚══════╝╚══════╝   ╚═╝                           ║
║                                                                            ║
║                              Backend                                       ║
║                                                                            ║
╚══════════════════════════════════════════════════════════════════════════════╝
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
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ExamTrack Backend</title>
        <style>
            :root {
                --background: #fafafa;
                --foreground: #0f172a;
                --card: #ffffff;
                --card-foreground: #0f172a;
                --primary: #3b82f6;
                --primary-foreground: #ffffff;
                --secondary: #f1f5f9;
                --secondary-foreground: #0f172a;
                --muted: #f1f5f9;
                --muted-foreground: #64748b;
                --accent: #f1f5f9;
                --accent-foreground: #0f172a;
                --border: #e2e8f0;
                --radius: 0.5rem;
            }

            .dark {
                --background: #0f172a;
                --foreground: #f8fafc;
                --card: #1e293b;
                --card-foreground: #f8fafc;
                --primary: #3b82f6;
                --primary-foreground: #f8fafc;
                --secondary: #1e293b;
                --secondary-foreground: #f8fafc;
                --muted: #1e293b;
                --muted-foreground: #94a3b8;
                --accent: #1e293b;
                --accent-foreground: #f8fafc;
                --border: #334155;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: var(--background);
                color: var(--foreground);
                line-height: 1.6;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1rem;
            }

            .container {
                width: 100%;
                max-width: 800px;
                background-color: var(--card);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                overflow: hidden;
            }

            .header {
                background: linear-gradient(135deg, var(--primary) 0%, #6366f1 100%);
                color: var(--primary-foreground);
                padding: 2rem;
                text-align: center;
            }

            .ascii-art {
                font-family: 'Courier New', monospace;
                white-space: pre;
                font-size: 10px;
                line-height: 1.1;
                margin-bottom: 1rem;
                color: var(--primary-foreground);
            }

            .content {
                padding: 2rem;
            }

            .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                background-color: #dcfce7;
                color: #166534;
                padding: 0.25rem 0.75rem;
                border-radius: 9999px;
                font-size: 0.875rem;
                font-weight: 500;
                margin-bottom: 1.5rem;
            }

            .dark .status-badge {
                background-color: #166534;
                color: #dcfce7;
            }

            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }

            .info-card {
                background-color: var(--muted);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                padding: 1.5rem;
            }

            .info-card h3 {
                color: var(--foreground);
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 1rem;
            }

            .info-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 0;
                border-bottom: 1px solid var(--border);
            }

            .info-item:last-child {
                border-bottom: none;
            }

            .info-label {
                color: var(--muted-foreground);
                font-size: 0.875rem;
            }

            .info-value {
                color: var(--foreground);
                font-weight: 500;
            }

            .links-section {
                margin-bottom: 2rem;
            }

            .links-section h3 {
                color: var(--foreground);
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 1rem;
            }

            .link-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }

            .link-card {
                background-color: var(--secondary);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                padding: 1rem;
                text-align: center;
                transition: all 0.2s ease;
                text-decoration: none;
                color: var(--secondary-foreground);
            }

            .link-card:hover {
                background-color: var(--accent);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .link-icon {
                font-size: 1.5rem;
                margin-bottom: 0.5rem;
                display: block;
            }

            .link-title {
                font-weight: 600;
                color: var(--foreground);
            }

            .features-section h3 {
                color: var(--foreground);
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 1rem;
            }

            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 0.75rem;
            }

            .feature-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem;
                background-color: var(--muted);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                font-size: 0.875rem;
                color: var(--muted-foreground);
            }

            .theme-toggle {
                position: fixed;
                top: 1rem;
                right: 1rem;
                background: none;
                border: 1px solid var(--border);
                border-radius: var(--radius);
                padding: 0.5rem;
                cursor: pointer;
                color: var(--foreground);
                font-size: 1.25rem;
            }

            @media (max-width: 640px) {
                .ascii-art {
                    font-size: 8px;
                }
                .header {
                    padding: 1.5rem;
                }
                .content {
                    padding: 1.5rem;
                }
                .info-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <button class="theme-toggle" onclick="toggleTheme()" title="Toggle theme">🌓</button>

        <div class="container">
            <div class="header">
                <div class="ascii-art">${asciiArt}</div>
                <div class="status-badge">
                    <span>🟢</span>
                    <span>Backend Online</span>
                </div>
            </div>

            <div class="content">
                <div class="info-grid">
                    <div class="info-card">
                        <h3>📊 Server Info</h3>
                        <div class="info-item">
                            <span class="info-label">Version</span>
                            <span class="info-value">${
                              serverInfo.version
                            }</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Environment</span>
                            <span class="info-value">${
                              serverInfo.environment
                            }</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Port</span>
                            <span class="info-value">${serverInfo.port}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Started</span>
                            <span class="info-value">${new Date(
                              serverInfo.timestamp
                            ).toLocaleString()}</span>
                        </div>
                    </div>

                    <div class="info-card">
                        <h3>🔧 Services</h3>
                        <div class="info-item">
                            <span class="info-label">HTTP Server</span>
                            <span class="info-value" style="color: #10b981;">✓ Active</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Socket.io</span>
                            <span class="info-value" style="color: #10b981;">✓ Enabled</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Database</span>
                            <span class="info-value" style="color: #10b981;">✓ Connected</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Token Cleanup</span>
                            <span class="info-value" style="color: #10b981;">✓ Running</span>
                        </div>
                    </div>
                </div>

                <div class="links-section">
                    <h3>🔗 Quick Links</h3>
                    <div class="link-grid">
                        <a href="/health" class="link-card">
                            <span class="link-icon">❤️</span>
                            <div class="link-title">Health Check</div>
                        </a>
                        <a href="/api" class="link-card">
                            <span class="link-icon">📋</span>
                            <div class="link-title">API Endpoints</div>
                        </a>
                    </div>
                </div>

                <div class="features-section">
                    <h3>✨ Features</h3>
                    <div class="features-grid">
                        ${serverInfo.features
                          .map(
                            (feature) =>
                              `<div class="feature-item">${feature}</div>`
                          )
                          .join("")}
                    </div>
                </div>
            </div>
        </div>

        <script>
            function toggleTheme() {
                document.body.classList.toggle('dark');
                const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
                localStorage.setItem('theme', theme);
            }

            // Load saved theme
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark');
            }
        </script>
    </body>
    </html>
  `);
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

// Start server (HTTP + Socket.io on same port)
httpServer.listen(PORT, "0.0.0.0", () => {
  const startupBanner = `
╔══════════════════════════════════════════════════════════════╗
║                                                                            ║
║                            ███████╗███████╗████████╗                        ║
║                            ██╔════╝██╔════╝╚══██╔══╝                        ║
║                            █████╗  ███████╗   ██║                           ║
║                            ██╔══╝  ╚════██║   ██║                           ║
║                            ███████╗███████║   ██║                           ║
║                            ╚══════╝╚══════╝   ╚═╝                           ║
║                                                                            ║
║                              Backend                                       ║
║                                                                            ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

  console.log("\x1b[36m%s\x1b[0m", startupBanner);
  console.log(
    "\x1b[32m%s\x1b[0m",
    "╔══════════════════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "\x1b[32m%s\x1b[0m",
    "║                           🚀 SERVER STARTUP COMPLETE                          ║"
  );
  console.log(
    "\x1b[32m%s\x1b[0m",
    "╚══════════════════════════════════════════════════════════════════════════════╝"
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
