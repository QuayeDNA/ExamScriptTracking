import { create } from "zustand";
import type { User } from "@/types";
import * as storage from "@/utils/storage";
import { apiClient } from "@/lib/api-client";
import { initializeAppContext } from "./appContext";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  invalidateAuth: () => void;
  validateToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: user !== null, isLoading: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  initialize: async () => {
    try {
      const user = await storage.getUser();
      const token = await storage.getToken();

      if (token && user) {
        // Set user immediately from storage (optimistic)
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });

        // Initialize app context with user data
        await initializeAppContext();

        // Validate token in background to refresh user data
        apiClient
          .get<{ user: User }>("/auth/profile")
          .then((response) => {
            // Update with fresh data from server
            set({
              user: response.user,
              isAuthenticated: true,
            });
            // Update stored user data
            storage.updateUser(response.user);
          })
          .catch((error) => {
            // Only clear auth if it's a permanent auth failure (not network issues)
            if (error?.error?.includes("Invalid token") || error?.error?.includes("Unauthorized")) {
              console.log("Token permanently invalid, clearing auth");
              storage.clearAuth();
              set({ user: null, isAuthenticated: false });
            } else {
              // Network error or temporary issue - keep user logged in with cached data
              console.log("Token validation failed (network issue), keeping cached auth");
            }
          });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    console.log("User explicitly logging out");
    
    // Clear app context
    const { clearAppPreference } = await import("./appContext");
    await clearAppPreference();
    
    // Clear auth
    await storage.clearAuth();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  invalidateAuth: () => {
    // When API returns 401, attempt to re-validate
    // If we have stored credentials, try to validate again
    const currentState = useAuthStore.getState();
    if (currentState.user) {
      console.log("Auth invalidated by API, but keeping cached user for now");
      // Don't immediately log out - let the user continue with cached data
      // The next API call will attempt to use the token again
    } else {
      set({ user: null, isAuthenticated: false });
    }
  },

  validateToken: async () => {
    try {
      const response = await apiClient.get<{ user: User }>("/auth/profile");
      // If successful, update user data
      set({ user: response.user, isAuthenticated: true });
    } catch (error) {
      // Token is invalid, auth store will be updated by the API client's interceptor
      console.log("Token validation failed:", error);
    }
  },
}));

// Set up auth invalidation callback
apiClient.setOnAuthInvalid(() => {
  useAuthStore.getState().invalidateAuth();
});
