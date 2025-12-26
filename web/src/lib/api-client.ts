import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiError } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: string) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue this request until token is refreshed
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken = localStorage.getItem("refreshToken");

          if (!refreshToken) {
            // Only logout if not on login page
            if (
              window.location.pathname !== "/login" &&
              window.location.pathname !== "/mobile/login"
            ) {
              this.handleLogout();
            }
            return Promise.reject(error);
          }

          try {
            const response = await axios.post(
              `${API_URL}/api/auth/refresh-token`,
              { refreshToken }
            );

            const { token, refreshToken: newRefreshToken } = response.data;

            localStorage.setItem("token", token);
            localStorage.setItem("refreshToken", newRefreshToken);

            this.processQueue(null, token);
            this.isRefreshing = false;

            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.isRefreshing = false;
            // Only logout if not on login page
            if (
              window.location.pathname !== "/login" &&
              window.location.pathname !== "/mobile/login"
            ) {
              this.handleLogout();
            }
            return Promise.reject(refreshError);
          }
        }

        // Format error consistently
        const apiError: ApiError = {
          error:
            (error.response?.data as any)?.error ||
            (error.response?.data as any)?.message ||
            error.message ||
            "Network error",
          details: (error.response?.data as any)?.details,
        };
        return Promise.reject(apiError);
      }
    );
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else if (token) {
        promise.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  setToken(token: string) {
    localStorage.setItem("token", token);
  }

  removeToken() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  }

  getToken(): string | null {
    return localStorage.getItem("token");
  }
}

export const apiClient = new ApiClient();

/**
 * Utility function to construct full URLs for uploaded files
 * @param relativePath - The relative path from the backend (e.g., "/uploads/students/image.png")
 * @returns Full URL to access the file
 */
export const getFileUrl = (relativePath: string): string => {
  if (!relativePath) return "";

  // If it's already a full URL (e.g., from Cloudinary), return as-is
  if (
    relativePath.startsWith("http://") ||
    relativePath.startsWith("https://")
  ) {
    return relativePath;
  }

  // Remove leading slash if present and construct full URL
  const cleanPath = relativePath.startsWith("/")
    ? relativePath.substring(1)
    : relativePath;
  return `${API_URL}/${cleanPath}`;
};
