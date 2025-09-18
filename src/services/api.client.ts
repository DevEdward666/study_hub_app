import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { z } from 'zod';
import { ApiResponse } from '../schema/api.schema';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = 'https://studyhubapi-i0o7.onrender.com/api/') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      const token = this.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearAuthToken();
          // Redirect to login or show auth modal
          // window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  private clearAuthToken(): void {
    localStorage.removeItem('auth_token');
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    schema: z.ZodSchema<ApiResponse<T>>,
    data?: any
  ): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.request({
        method,
        url,
        data,
      });

      const validatedResponse = schema.parse(response.data);
      
      if (!validatedResponse.success) {
        throw new Error(validatedResponse.message || 'API request failed');
      }

      return validatedResponse.data!;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error('Invalid API response format');
      }
      throw error;
    }
  }

  async get<T>(url: string, schema: z.ZodSchema<ApiResponse<T>>): Promise<T> {
    return this.request('GET', url, schema);
  }

  async post<T>(url: string, schema: z.ZodSchema<ApiResponse<T>>, data?: any): Promise<T> {
    return this.request('POST', url, schema, data);
  }

  async put<T>(url: string, schema: z.ZodSchema<ApiResponse<T>>, data?: any): Promise<T> {
    return this.request('PUT', url, schema, data);
  }

  async delete<T>(url: string, schema: z.ZodSchema<ApiResponse<T>>): Promise<T> {
    return this.request('DELETE', url, schema);
  }

  // Auth token management
  saveAuthToken(token: string): void {
    this.setAuthToken(token);
  }

  removeAuthToken(): void {
    this.clearAuthToken();
  }
}

export const apiClient = new ApiClient();