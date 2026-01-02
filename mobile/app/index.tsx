import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { useAppContext } from "@/store/appContext";
import { View, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";

export default function Index() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
  const { 
    lastUsedApp, 
    isLoading: appContextLoading,
    checkAccess, 
    canAccessExamApp, 
    canAccessAttendanceApp,
    loadLastUsedApp 
  } = useAppContext();
  
  const [initialized, setInitialized] = useState(false);

  // Initialize app context when user changes
  useEffect(() => {
    const init = async () => {
      if (user) {
        checkAccess();
        await loadLastUsedApp();
        setInitialized(true);
      }
    };
    init();
  }, [user]);

  // Show loading while checking auth state OR app context is loading OR not initialized
  if (authLoading || appContextLoading || (user && !initialized)) {
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

  // Route to last used app if available
  if (lastUsedApp) {
    console.log('Routing to last used app:', lastUsedApp);
    if (lastUsedApp === 'exam' && canAccessExamApp) {
      return <Redirect href="/(exam-tabs)" />;
    } else if (lastUsedApp === 'attendance' && canAccessAttendanceApp) {
      return <Redirect href="/(attendance-tabs)" />;
    }
  }

  // First time or no valid preference - show selector
  console.log('No last used app, showing app selector');
  return <Redirect href="/app-selector" />;
}
