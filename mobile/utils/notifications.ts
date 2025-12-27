import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Configure notification behavior for the app
 */
export function configureNotifications() {
  // Set up notification categories with actions
  Notifications.setNotificationCategoryAsync("transfer_request", [
    {
      identifier: "ACCEPT",
      buttonTitle: "Accept",
      options: {
        isAuthenticationRequired: false,
        opensAppToForeground: true,
      },
    },
    {
      identifier: "VIEW",
      buttonTitle: "View Details",
      options: {
        isAuthenticationRequired: false,
        opensAppToForeground: true,
      },
    },
    {
      identifier: "REJECT",
      buttonTitle: "Reject",
      options: {
        isAuthenticationRequired: false,
        opensAppToForeground: true,
        isDestructive: true, // Move inside options for iOS
      },
    },
  ]);

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request notification permissions from the user
 * @returns Permission status
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | undefined
> {
  let token: string | undefined;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Failed to get push notification permissions!");
    return;
  }

  // Get the push token (for future use with a push notification service)
  // For now, we're using local notifications only
  // Note: Push tokens don't work in Expo Go (SDK 53+), only in development builds
  try {
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Push token:", token);
  } catch (error) {
    // Silently ignore push token errors in Expo Go
    // This is expected behavior and doesn't affect local notifications
    if (__DEV__) {
      console.log(
        "Push tokens not available in Expo Go. Use local notifications only.",
        error
      );
    }
  }

  return token;
}

/**
 * Schedule a local notification immediately
 */
export async function scheduleNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  categoryId?: string
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        categoryIdentifier: categoryId,
      },
      trigger: null, // null = show immediately
    });
  } catch (error) {
    console.error("Error scheduling notification:", error);
  }
}

/**
 * Set up notification response listener
 */
export function setupNotificationResponseListener(
  onResponse: (response: Notifications.NotificationResponse) => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    onResponse
  );
  return subscription;
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification permission status
 */
export async function getNotificationPermissionStatus() {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}