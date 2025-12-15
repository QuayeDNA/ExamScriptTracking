import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import Constants from "expo-constants";
import type { ApiError } from "@/types";
import { getToken, clearAuth } from "@/utils/storage";

// Base API URL: allow overriding via EXPO_PUBLIC_API_URL, otherwise fall back to localhost.
// When running on a physical device or Expo Go, replace 'localhost' with the packager host IP
// (available via Expo Constants) so the app can reach the machine running the backend.
let API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

try {
  if (API_URL.includes("localhost")) {
    // debuggerHost looks like "192.168.0.5:19001" in Expo
    const debuggerHost =
      (Constants as any)?.manifest?.debuggerHost ||
      (Constants as any)?.expoGo?.packagerOpts?.hostUri;
    if (debuggerHost) {
      const host = String(debuggerHost).split(":")[0];
      API_URL = API_URL.replace("localhost", host);
    }
  }
} catch (e) {
  // Guard against unexpected runtime errors; keep the fallback URL intact
  // eslint-disable-next-line no-console
  console.warn("Could not resolve debugger host for API_URL replacement", e);
}

class ApiClient {
  private client: AxiosInstance;
  private onAuthInvalid?: () => void;

  constructor(onAuthInvalid?: () => void) {
    this.onAuthInvalid = onAuthInvalid;
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Helpful runtime info for debugging network issues on devices
    // eslint-disable-next-line no-console
    console.log("API client using baseURL:", API_URL);

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(
          `API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
        );
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response.data;
      },
      async (error) => {
        console.error(
          `API Error: ${error.response?.status} ${error.config?.url}`,
          error.response?.data
        );

        if (error.response?.status === 401) {
          await clearAuth();
          // Notify auth invalidation callback
          this.onAuthInvalid?.();
        }

        const apiError: ApiError = {
          error:
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            "Network error",
          details: error.response?.data?.details,
        };
        return Promise.reject(apiError);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get<T, T>(url, config);
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.post<T, T>(url, data, config);
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.put<T, T>(url, data, config);
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.client.patch<T, T>(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete<T, T>(url, config);
  }

  setOnAuthInvalid(callback: () => void) {
    this.onAuthInvalid = callback;
  }
}

export const apiClient = new ApiClient();
