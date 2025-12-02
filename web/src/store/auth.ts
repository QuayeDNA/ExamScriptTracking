import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,

      setAuth: (user, token, refreshToken) => {
        set({ user, token, refreshToken });
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
      },

      setUser: (user) => {
        set({ user });
      },

      clearAuth: () => {
        set({ user: null, token: null, refreshToken: null });
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      },

      isAuthenticated: () => {
        const state = get();
        return !!state.token && !!state.user;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
