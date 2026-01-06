import apiClient, { extractData, extractMessage, ApiResponse } from '../lib/api-client';
import { setAuthToken, removeAuthToken } from '../lib/cookies';

/**
 * User interface matching backend User model
 */
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'client' | 'company' | 'admin';
  status: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  company?: any; // Company details if role is 'company'
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  role: 'client' | 'company';
}

/**
 * Auth response containing user and token
 */
export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    const authData = extractData<AuthResponse>(response);
    
    // Store token in cookie
    setAuthToken(authData.token);
    
    return authData;
  },

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    const authData = extractData<AuthResponse>(response);
    
    // Store token in cookie
    setAuthToken(authData.token);
    
    return authData;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post<ApiResponse>('/auth/logout');
    } catch (error) {
      // Even if API call fails, remove token locally
      console.error('Logout error:', error);
    } finally {
      // Always remove token from cookie
      removeAuthToken();
    }
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return extractData<User>(response);
  },
};

