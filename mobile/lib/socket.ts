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

    // Use the same base URL as the API client, but without /api suffix
    const API_BASE =
      process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";
    const SOCKET_URL = API_BASE.replace("/api", "");

    console.log("🔌 Attempting socket connection to:", SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000, // Increase timeout for mobile connections
      transports: ["websocket", "polling"], // Try websocket first, fallback to polling
      forceNew: false,
      upgrade: true,
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket connected successfully:", this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      console.log("🔍 Connection details:", {
        url: SOCKET_URL,
        tokenPresent: !!token,
        tokenLength: token?.length,
        error: error.message,
      });

      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("🚫 Max reconnection attempts reached");
      }
    });

    this.socket.on("reconnect_attempt", (attempt) => {
      console.log(
        `🔄 Socket reconnection attempt ${attempt}/${this.maxReconnectAttempts}`
      );
    });

    this.socket.on("reconnect", (attempt) => {
      console.log(`✅ Socket reconnected after ${attempt} attempts`);
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

    // Class attendance student scanned
    this.socket.on(
      "class_attendance:student_scanned",
      async (data: unknown) => {
        const eventData = data as SocketData;
        console.log("Class attendance student scanned:", eventData);
        // Note: Notifications handled by active recording screen
      }
    );

    // Class attendance recording started
    this.socket.on(
      "class_attendance:recording_started",
      async (data: unknown) => {
        const eventData = data as SocketData;
        await scheduleNotification(
          "Recording Started",
          `Attendance recording started for ${eventData.courseName || "class"}`,
          { type: "class_attendance_started", ...eventData }
        );
      }
    );

    // Class attendance recording ended
    this.socket.on(
      "class_attendance:recording_ended",
      async (data: unknown) => {
        const eventData = data as SocketData;
        await scheduleNotification(
          "Recording Completed",
          `Attendance recording completed: ${eventData.totalStudents || 0} students`,
          { type: "class_attendance_ended", ...eventData }
        );
      }
    );

    // ============================================
    // Incident Management Socket Events
    // ============================================

    // Incident created
    this.socket.on("incident:created", async (data: unknown) => {
      const eventData = data as SocketData;
      await scheduleNotification(
        "New Incident Reported",
        `${eventData.incidentNumber}: ${eventData.title}`,
        { type: "incident_created", ...eventData }
      );
    });

    // Incident updated
    this.socket.on("incident:updated", async (data: unknown) => {
      const eventData = data as SocketData;
      await scheduleNotification(
        "Incident Updated",
        `${eventData.incidentNumber} has been updated`,
        { type: "incident_updated", ...eventData }
      );
    });

    // Incident assigned
    this.socket.on("incident:assigned", async (data: unknown) => {
      const eventData = data as SocketData;
      await scheduleNotification(
        "Incident Assigned",
        `${eventData.incidentNumber} assigned to ${eventData.assigneeName}`,
        { type: "incident_assigned", ...eventData }
      );
    });

    // Incident status changed
    this.socket.on("incident:status_changed", async (data: unknown) => {
      const eventData = data as SocketData;
      await scheduleNotification(
        "Incident Status Changed",
        `${eventData.incidentNumber}: ${eventData.oldStatus} → ${eventData.newStatus}`,
        { type: "incident_status_changed", ...eventData }
      );
    });

    // Incident comment added
    this.socket.on("incident:comment_added", async (data: unknown) => {
      const eventData = data as SocketData;
      await scheduleNotification(
        "New Comment",
        `${eventData.userName} commented on ${eventData.incidentNumber}`,
        { type: "incident_comment", ...eventData }
      );
    });

    // Incident attachment added
    this.socket.on("incident:attachment_added", async (data: unknown) => {
      const eventData = data as SocketData;
      await scheduleNotification(
        "New Attachment",
        `New file attached to ${eventData.incidentNumber}`,
        { type: "incident_attachment", ...eventData }
      );
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

  /**
   * Subscribe to a socket event with a callback
   * Returns an unsubscribe function
   */
  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.socket) {
      console.warn("Cannot subscribe to event: socket not connected");
      return () => {};
    }

    this.socket.on(event, callback);

    // Return unsubscribe function
    return () => {
      this.socket?.off(event, callback);
    };
  }
}

export const mobileSocketService = new MobileSocketService();
