import { useEffect } from "react";
import { mobileSocketService } from "@/lib/socket";
import { useAuthStore } from "@/store/auth";

/**
 * Custom hook to manage socket connection lifecycle
 * Connects when authenticated, disconnects when not
 */
export function useSocket() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      mobileSocketService.disconnect();
      return;
    }

    // Connect socket when authenticated
    mobileSocketService.connect();

    // Cleanup on unmount
    return () => {
      mobileSocketService.disconnect();
    };
  }, [isAuthenticated]);

  return {
    isConnected: mobileSocketService.isConnected(),
    emit: mobileSocketService.emit.bind(mobileSocketService),
    on: mobileSocketService.on.bind(mobileSocketService),
  };
}
