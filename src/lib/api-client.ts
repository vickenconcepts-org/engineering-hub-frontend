import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

/**
 * Standard API Response Format
 * Matches backend ApiResponse format: { success, message, data, errors, meta }
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  meta?: Record<string, any>;
}

/**
 * API Client Configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const TOKEN_COOKIE_NAME = 'auth_token';

// Debug: Log API base URL (remove in production if desired)
if (import.meta.env.MODE === 'development' || import.meta.env.MODE === 'production') {
  console.log('API Base URL:', API_BASE_URL);
  console.log('Environment:', import.meta.env.MODE);
  console.log('VITE_API_BASE_URL env var:', import.meta.env.VITE_API_BASE_URL);
}

/**
 * Create axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token to headers and handle FormData
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get(TOKEN_COOKIE_NAME);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If FormData, remove Content-Type header to let axios set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle standard response format and errors
 */
apiClient.interceptors.response.use(
  (response) => {
    // Backend returns data in response.data with standard format
    // { success, message, data, errors, meta }
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // Handle 401 Unauthorized - Clear token and redirect to login
    if (status === 401) {
      Cookies.remove(TOKEN_COOKIE_NAME);
      // Don't show toast for 401 - redirect will happen
      // Redirect to login will be handled by App.tsx
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      return Promise.reject(error);
    }

    // Handle 403 Forbidden
    if (status === 403) {
      toast.error(data?.message || 'You do not have permission to perform this action.');
      return Promise.reject(error);
    }

    // Handle 422 Validation Errors
    if (status === 422 && data?.errors) {
      // Show first validation error
      const firstError = Object.values(data.errors)[0]?.[0];
      if (firstError) {
        toast.error(firstError);
      }
      return Promise.reject(error);
    }

    // Handle other errors with message from backend
    if (data?.message) {
      toast.error(data.message);
    } else {
      toast.error('An unexpected error occurred. Please try again.');
    }

    return Promise.reject(error);
  }
);

/**
 * Helper function to extract data from standard API response
 */
export function extractData<T>(response: { data: ApiResponse<T> }): T {
  if (response.data.success && response.data.data !== undefined) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Invalid response format');
}

/**
 * Helper function to extract message from standard API response
 */
export function extractMessage(response: { data: ApiResponse }): string {
  return response.data.message || 'Operation completed';
}

/**
 * Helper function to extract errors from standard API response
 */
export function extractErrors(response: { data: ApiResponse }): Record<string, string[]> {
  return response.data.errors || {};
}

/**
 * Helper function to extract meta from standard API response
 */
export function extractMeta(response: { data: ApiResponse }): Record<string, any> {
  return response.data.meta || {};
}

export default apiClient;

