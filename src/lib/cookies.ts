import Cookies from 'js-cookie';

/**
 * Cookie utility functions
 * Used for storing authentication tokens
 */

const TOKEN_COOKIE_NAME = 'auth_token';
const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict' as const,
};

/**
 * Set authentication token in cookie
 */
export function setAuthToken(token: string): void {
  Cookies.set(TOKEN_COOKIE_NAME, token, COOKIE_OPTIONS);
}

/**
 * Get authentication token from cookie
 */
export function getAuthToken(): string | undefined {
  return Cookies.get(TOKEN_COOKIE_NAME);
}

/**
 * Remove authentication token from cookie
 */
export function removeAuthToken(): void {
  Cookies.remove(TOKEN_COOKIE_NAME);
}

/**
 * Check if user is authenticated (has token)
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

