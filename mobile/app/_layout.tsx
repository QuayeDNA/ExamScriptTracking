import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuthStore } from "@/store/auth";
import { useSocket } from "@/hooks/useSocket";
import { useNotificationNavigation } from "@/hooks/useNotificationNavigation";
import {
  configureNotifications,
  registerForPushNotificationsAsync,
} from "@/utils/notifications";

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const isAttendanceUser = user?.role === "CLASS_REP";
  const firstSegment = segments[0] as string | undefined;

  useEffect(() => {
    if (isLoading) return;

    // Wait for router to be ready
    const timeout = setTimeout(() => {
      const inAuthFlow =
        firstSegment === "login" || firstSegment === "change-password";

      // Redirect unauthenticated users to login
      if (!isAuthenticated && !inAuthFlow) {
        router.replace("/login");
      } else if (
        isAuthenticated &&
        !user?.passwordChanged &&
        firstSegment !== "change-password"
      ) {
        router.replace("/change-password");
      } else if (isAuthenticated && user?.passwordChanged && isAttendanceUser) {
        const inAttendance = firstSegment === "attendance";
        if (!inAttendance) {
          router.replace("/attendance" as any);
        }
      } else if (isAuthenticated && user?.passwordChanged && inAuthFlow) {
        router.replace("/(tabs)");
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [
    firstSegment,
    isAuthenticated,
    isLoading,
    isAttendanceUser,
    segments,
    user,
    router,
  ]);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initialize = useAuthStore((state) => state.initialize);
  const notificationListener = useRef<Notifications.Subscription | undefined>(
    undefined
  );
  const responseListener = useRef<Notifications.Subscription | undefined>(
    undefined
  );
  const { handleNotificationTap } = useNotificationNavigation();

  // Create QueryClient instance
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  });

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
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useProtectedRoute();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="change-password" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="attendance/index" />
          <Stack.Screen
            name="attendance/record"
            options={{ headerShown: true, title: "Attendance Recording" }}
          />
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
            name="recent-activity"
            options={{
              headerShown: false, // Custom header in component
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="modal"
            options={{
              presentation: "modal",
              headerShown: true,
              title: "Modal",
            }}
          />
        </Stack>
        <StatusBar style="auto" />
        <Toast
          config={{
            success: (props) => (
              <BaseToast
                {...props}
                style={{ borderLeftColor: "#10b981" }}
                contentContainerStyle={{ paddingHorizontal: 15 }}
                text1Style={{
                  fontSize: 15,
                  fontWeight: "600",
                }}
                text2Style={{
                  fontSize: 13,
                }}
              />
            ),
            error: (props) => (
              <ErrorToast
                {...props}
                style={{ borderLeftColor: "#ef4444" }}
                text1Style={{
                  fontSize: 15,
                  fontWeight: "600",
                }}
                text2Style={{
                  fontSize: 13,
                }}
              />
            ),
            warning: (props) => (
              <BaseToast
                {...props}
                style={{ borderLeftColor: "#f59e0b" }}
                contentContainerStyle={{ paddingHorizontal: 15 }}
                text1Style={{
                  fontSize: 15,
                  fontWeight: "600",
                }}
                text2Style={{
                  fontSize: 13,
                }}
              />
            ),
            info: (props) => (
              <BaseToast
                {...props}
                style={{ borderLeftColor: "#3b82f6" }}
                contentContainerStyle={{ paddingHorizontal: 15 }}
                text1Style={{
                  fontSize: 15,
                  fontWeight: "600",
                }}
                text2Style={{
                  fontSize: 13,
                }}
              />
            ),
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
