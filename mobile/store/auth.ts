import { create } from "zustand";
import type { User } from "@/types";
import * as storage from "@/utils/storage";
import { apiClient } from "@/lib/api-client";

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
        // Validate the token by trying to get profile
        await apiClient
          .get<{ user: User }>("/auth/profile")
          .then((response) => {
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
            });
          })
          .catch(() => {
            // Token invalid, clear auth
            storage.clearAuth();
            set({ user: null, isAuthenticated: false, isLoading: false });
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
    await storage.clearAuth();
    set({ user: null, isAuthenticated: false });
  },

  invalidateAuth: () => {
    set({ user: null, isAuthenticated: false });
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
