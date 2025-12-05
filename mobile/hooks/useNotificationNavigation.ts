import { useRouter } from "expo-router";

interface NotificationData {
  type?: string;
  id?: string;
  examSessionId?: string;
  [key: string]: unknown;
}

/**
 * Hook to handle navigation based on notification tap
 * Maps notification types to relevant screens
 */
export function useNotificationNavigation() {
  const router = useRouter();

  const handleNotificationTap = (data: NotificationData) => {
    if (!data || !data.type) {
      console.warn("No notification type provided");
      return;
    }

    console.log("Navigating based on notification:", data.type);

    try {
      switch (data.type) {
        case "transfer_requested":
        case "transfer_confirmed":
        case "transfer_rejected":
        case "transfer_updated":
          // Navigate to custody tab to see transfers
          router.push("/(tabs)/custody");
          break;

        case "batch_status":
        case "batch_created":
          // Navigate to batch details if we have the ID
          if (data.examSessionId || data.id) {
            router.push({
              pathname: "/batch-details",
              params: { id: data.examSessionId || data.id },
            });
          } else {
            // Fallback to main tab
            router.push("/(tabs)");
          }
          break;

        case "attendance_recorded":
          // Navigate to scanner tab (attendance section)
          router.push("/(tabs)/scanner");
          break;

        default:
          // Unknown type, navigate to home
          console.log("Unknown notification type, navigating to home");
          router.push("/(tabs)");
      }
    } catch (error) {
      console.error("Error navigating from notification:", error);
      // Fallback to home on error
      router.push("/(tabs)");
    }
  };

  return { handleNotificationTap };
}
