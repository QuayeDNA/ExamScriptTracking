import { create } from "zustand";
import type { User } from "@/types";
import * as storage from "@/utils/storage";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
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
      const isAuth = await storage.isAuthenticated();
      set({ user, isAuthenticated: isAuth, isLoading: false });
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    await storage.clearAuth();
    set({ user: null, isAuthenticated: false });
  },
}));
