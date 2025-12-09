import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const isAttendanceUser = user?.role === "CLASS_REP";

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Redirect based on auth state
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (isAuthenticated && !user?.passwordChanged) {
    return <Redirect href="/change-password" />;
  }

  return (
    <Redirect href={isAttendanceUser ? ("/attendance" as any) : "/(tabs)"} />
  );
}
