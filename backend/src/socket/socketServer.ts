import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

/**
 * Initialize Socket.io server with authentication and CORS
 */
export function initializeSocketServer(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173", // Vite dev server (web)
        "http://localhost:8081", // Expo dev server (mobile)
        "http://localhost:19006", // Expo web
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      ) as {
        userId: string;
        role: string;
      };

      // Check if user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return next(
          new Error("Authentication error: User not found or inactive")
        );
      }

      // Attach user info to socket
      socket.userId = user.id;
      socket.userRole = user.role;

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Connection handling
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join role-specific room
    socket.join(`role:${socket.userRole}`);

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${socket.userId} - Reason: ${reason}`);
    });

    // Handle client ping (for connection health check)
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  console.log("Socket.io server initialized");

  return io;
}

/**
 * Socket event types for type safety
 */
export enum SocketEvents {
  // Transfer events
  TRANSFER_REQUESTED = "transfer:requested",
  TRANSFER_CONFIRMED = "transfer:confirmed",
  TRANSFER_REJECTED = "transfer:rejected",
  TRANSFER_UPDATED = "transfer:updated",

  // Batch events
  BATCH_STATUS_UPDATED = "batch:status_updated",
  BATCH_CREATED = "batch:created",

  // Attendance events
  ATTENDANCE_RECORDED = "attendance:recorded",

  // Notification events
  NOTIFICATION_NEW = "notification:new",
  NOTIFICATION_READ = "notification:read",

  // Dashboard events
  DASHBOARD_STATS_UPDATED = "dashboard:stats_updated",
}

/**
 * Emit event to specific user
 */
export function emitToUser(
  io: Server,
  userId: string,
  event: string,
  data: any
) {
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Emit event to all users with specific role
 */
export function emitToRole(io: Server, role: string, event: string, data: any) {
  io.to(`role:${role}`).emit(event, data);
}

/**
 * Emit event to all users with any of the specified roles
 */
export function emitToRoles(
  io: Server,
  roles: string[],
  event: string,
  data: any
) {
  roles.forEach((role) => {
    io.to(`role:${role}`).emit(event, data);
  });
}

/**
 * Emit event to all connected clients
 */
export function emitToAll(io: Server, event: string, data: any) {
  io.emit(event, data);
}
