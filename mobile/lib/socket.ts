import { io, Socket } from "socket.io-client";
import { getToken } from "@/utils/storage";
import { scheduleNotification } from "@/utils/notifications";

interface SocketData {
  courseCode?: string;
  courseName?: string;
  status?: string;
  student?: {
    firstName: string;
    lastName: string;
  };
  examSession?: {
    courseCode: string;
  };
  [key: string]: unknown;
}

class MobileSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect() {
    const token = await getToken();

    if (!token) {
      console.warn("No auth token available for socket connection");
      return;
    }

    // Validate token format (basic check)
    if (typeof token !== "string" || token.length < 20) {
      console.warn("Invalid token format, skipping socket connection");
      return;
    }

    // Use the actual IP address of your development machine
    // Replace with your backend URL in production
    const SOCKET_URL = "http://192.168.43.153:3000";

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      // Don't log authentication errors as errors, they're expected during development
      if (error.message.includes("Authentication")) {
        console.log("Socket authentication failed - please log in again");
        this.disconnect(); // Stop trying to reconnect with invalid token
        return;
      }

      console.error("Socket connection error:", error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
      }
    });

    // Setup event listeners
    this.setupEventListeners();

    // Health check
    setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit("ping");
      }
    }, 30000); // Every 30 seconds
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Transfer requested
    this.socket.on("transfer:requested", async (data: unknown) => {
      const eventData = data as SocketData;
      await scheduleNotification(
        "New Transfer Request",
        `Transfer request for ${eventData.courseCode} - ${eventData.courseName}`,
        { type: "transfer_requested", ...eventData }
      );
    });

    // Transfer confirmed
    this.socket.on("transfer:confirmed", async (data: unknown) => {
      const eventData = data as SocketData;
      await scheduleNotification(
        "Transfer Confirmed",
        `Your transfer for ${eventData.courseCode} has been confirmed`,
        { type: "transfer_confirmed", ...eventData }
      );
    });

    // Transfer rejected
    this.socket.on("transfer:rejected", async (data: unknown) => {
      const eventData = data as SocketData;
      await scheduleNotification(
        "Transfer Rejected",
        `Transfer for ${eventData.courseCode} was rejected`,
        { type: "transfer_rejected", ...eventData }
      );
    });

    // Transfer updated
    this.socket.on("transfer:updated", async (data: unknown) => {
      const eventData = data as SocketData;
      await scheduleNotification(
        "Transfer Updated",
        `Transfer for ${eventData.courseCode} has been updated`,
        { type: "transfer_updated", ...eventData }
      );
    });

    // Batch status updated
    this.socket.on("batch:status_updated", async (data: unknown) => {
      const eventData = data as SocketData;
      await scheduleNotification(
        "Batch Status Updated",
        `${eventData.courseCode} status: ${eventData.status}`,
        { type: "batch_status", ...eventData }
      );
    });

    // Batch created
    this.socket.on("batch:created", async (data: unknown) => {
      const eventData = data as SocketData;
      await scheduleNotification(
        "New Batch Created",
        `New exam session: ${eventData.courseCode} - ${eventData.courseName}`,
        { type: "batch_created", ...eventData }
      );
    });

    // Attendance recorded
    this.socket.on("attendance:recorded", async (data: unknown) => {
      const eventData = data as SocketData;
      await scheduleNotification(
        "Attendance Recorded",
        `${eventData.student?.firstName} ${eventData.student?.lastName} - ${eventData.examSession?.courseCode}`,
        { type: "attendance_recorded", ...eventData }
      );
    });

    // Dashboard stats updated (silent event)
    this.socket.on("dashboard:stats_updated", () => {
      // Could trigger a background data refresh here
      console.log("Dashboard stats updated");
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  emit(event: string, data?: unknown) {
    this.socket?.emit(event, data);
  }
}

export const mobileSocketService = new MobileSocketService();
