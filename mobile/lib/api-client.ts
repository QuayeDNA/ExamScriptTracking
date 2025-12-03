import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import type { ApiError } from "@/types";
import { getToken, clearAuth } from "@/utils/storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

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
}

export const apiClient = new ApiClient();
