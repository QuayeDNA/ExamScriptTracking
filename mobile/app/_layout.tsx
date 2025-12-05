import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import "../global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/store/auth";
import { useSocket } from "@/hooks/useSocket";
import { useNotificationNavigation } from "@/hooks/useNotificationNavigation";
import {
  configureNotifications,
  registerForPushNotificationsAsync,
} from "@/utils/notifications";

export const unstable_settings = {
  anchor: "(tabs)",
};

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const inAuthFlow =
      segments[0] === "login" || segments[0] === "change-password";

    // Redirect unauthenticated users to login
    if (!isAuthenticated && !inAuthFlow) {
      router.replace("/login");
    }
    // Redirect authenticated users with unchanged password to change password
    else if (
      isAuthenticated &&
      !user?.passwordChanged &&
      segments[0] !== "change-password"
    ) {
      router.replace("/change-password");
    }
    // Redirect authenticated users from login/change-password to main app
    else if (isAuthenticated && user?.passwordChanged && inAuthFlow) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments, user]);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initialize = useAuthStore((state) => state.initialize);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { handleNotificationTap } = useNotificationNavigation();

  // Initialize socket connection
  useSocket();

  useEffect(() => {
    initialize();

    // Configure notification behavior
    configureNotifications();

    // Request notification permissions
    registerForPushNotificationsAsync();

    // Listen for notifications received while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    // Listen for user interactions with notifications
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification tapped:", response);
        const data = response.notification.request.content.data;
        handleNotificationTap(data);
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  useProtectedRoute();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="batch-details"
          options={{
            headerShown: true,
            title: "Batch Details",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="student-attendance"
          options={{
            headerShown: true,
            title: "Student Attendance",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="initiate-transfer"
          options={{
            headerShown: true,
            title: "Initiate Transfer",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="confirm-transfer"
          options={{
            headerShown: true,
            title: "Confirm Transfer",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", headerShown: true, title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
