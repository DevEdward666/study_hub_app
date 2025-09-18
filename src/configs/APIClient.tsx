// lib/api-client.ts
import axios, { AxiosInstance } from "axios";
import { Redirect } from "react-router-dom";
import { z } from "zod";

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = "/api") {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("auth_token");
          const isAdminPath = window.location.pathname.includes("/admin");
          return <Redirect to={isAdminPath ? "/admin/login" : "/login"} />;
        }
        return Promise.reject(error);
      }
    );
  }

  private async request<T>(
    method: "get" | "post" | "put" | "delete" | "patch",
    url: string,
    schema: z.ZodSchema<T>,
    data?: any
  ): Promise<T> {
    try {
      const response = await this.client[method](url, data);
      return schema.parse(response.data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`API response validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  async get<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
    return this.request("get", url, schema);
  }

  async post<T>(url: string, schema: z.ZodSchema<T>, data?: any): Promise<T> {
    return this.request("post", url, schema, data);
  }

  async put<T>(url: string, schema: z.ZodSchema<T>, data?: any): Promise<T> {
    return this.request("put", url, schema, data);
  }

  async patch<T>(url: string, schema: z.ZodSchema<T>, data?: any): Promise<T> {
    return this.request("patch", url, schema, data);
  }

  async delete<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
    return this.request("delete", url, schema);
  }
}

export const apiClient = new ApiClient();
