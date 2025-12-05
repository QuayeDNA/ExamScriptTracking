import { useEffect } from "react";
import { socketService } from "@/lib/socket";
import { useAuthStore } from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";
import { toast } from "sonner";

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

export function useSocket() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  useEffect(() => {
    if (!isAuthenticated) {
      socketService.disconnect();
      return;
    }

    // Connect socket
    socketService.connect();

    // Transfer requested
    socketService.on("transfer:requested", (data: unknown) => {
      const eventData = data as SocketData;
      addNotification({
        type: "transfer_requested",
        title: "New Transfer Request",
        message: `Transfer request for ${eventData.courseCode} - ${eventData.courseName}`,
        data: eventData,
      });
      toast.info(`New transfer request: ${eventData.courseCode}`);
    });

    // Transfer confirmed
    socketService.on("transfer:confirmed", (data: unknown) => {
      const eventData = data as SocketData;
      addNotification({
        type: "transfer_confirmed",
        title: "Transfer Confirmed",
        message: `Transfer for ${eventData.courseCode} has been confirmed`,
        data: eventData,
      });
      toast.success(`Transfer confirmed: ${eventData.courseCode}`);
    });

    // Transfer rejected
    socketService.on("transfer:rejected", (data: unknown) => {
      const eventData = data as SocketData;
      addNotification({
        type: "transfer_rejected",
        title: "Transfer Rejected",
        message: `Transfer for ${eventData.courseCode} was rejected`,
        data: eventData,
      });
      toast.error(`Transfer rejected: ${eventData.courseCode}`);
    });

    // Transfer updated
    socketService.on("transfer:updated", (data: unknown) => {
      const eventData = data as SocketData;
      addNotification({
        type: "info",
        title: "Transfer Updated",
        message: `Transfer for ${eventData.courseCode} has been updated`,
        data: eventData,
      });
    });

    // Batch status updated
    socketService.on("batch:status_updated", (data: unknown) => {
      const eventData = data as SocketData;
      addNotification({
        type: "batch_status",
        title: "Batch Status Updated",
        message: `${eventData.courseCode} status: ${eventData.status}`,
        data: eventData,
      });
    });

    // Batch created
    socketService.on("batch:created", (data: unknown) => {
      const eventData = data as SocketData;
      addNotification({
        type: "info",
        title: "New Batch Created",
        message: `New exam session: ${eventData.courseCode} - ${eventData.courseName}`,
        data: eventData,
      });
    });

    // Attendance recorded
    socketService.on("attendance:recorded", (data: unknown) => {
      const eventData = data as SocketData;
      addNotification({
        type: "attendance",
        title: "Attendance Recorded",
        message: `${eventData.student?.firstName} ${eventData.student?.lastName} - ${eventData.examSession?.courseCode}`,
        data: eventData,
      });
    });

    // Dashboard stats updated
    socketService.on("dashboard:stats_updated", () => {
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent("dashboard:refresh"));
    });

    // Cleanup
    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, addNotification]);

  return {
    isConnected: socketService.isConnected(),
    emit: socketService.emit.bind(socketService),
  };
}
