import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { User } from "@/types";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user_data";

// Platform-specific storage implementation
const isWeb = Platform.OS === "web";

const storage = {
  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (isWeb) {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  async deleteItem(key: string): Promise<void> {
    if (isWeb) {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const saveAuth = async (
  token: string,
  refreshToken: string,
  user: User
): Promise<void> => {
  try {
    await Promise.all([
      storage.setItem(TOKEN_KEY, token),
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken),
      storage.setItem(USER_KEY, JSON.stringify(user)),
    ]);
  } catch (error) {
    console.error("Error saving auth data:", error);
    throw error;
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await storage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await storage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return null;
  }
};

export const getUser = async (): Promise<User | null> => {
  try {
    const userData = await storage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

export const updateUser = async (user: User): Promise<void> => {
  try {
    await storage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Error updating user data:", error);
    throw error;
  }
};

export const clearAuth = async (): Promise<void> => {
  try {
    await Promise.all([
      storage.deleteItem(TOKEN_KEY),
      storage.deleteItem(REFRESH_TOKEN_KEY),
      storage.deleteItem(USER_KEY),
    ]);
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return token !== null;
};
