/**
 * File URL Utilities
 * Helper functions for constructing URLs to view files stored in backend storage
 */

/**
 * Get the base URL for the backend (without /api)
 */
const getBackendBaseUrl = (): string => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  return apiBaseUrl.replace('/api', '');
};

/**
 * Get full URL for a file
 * Supports both Cloudinary URLs (full URLs) and local storage paths
 * 
 * @param filePathOrUrl - Cloudinary URL (https://...) or relative path from storage/app/public
 * @returns Full URL to access the file
 */
export const getFileUrl = (filePathOrUrl: string | null | undefined): string => {
  if (!filePathOrUrl) return '';
  
  // If it's already a full URL (Cloudinary), return as-is
  if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
    return filePathOrUrl;
  }
  
  // Otherwise, treat as local storage path
  // Remove leading slash if present
  const cleanPath = filePathOrUrl.startsWith('/') ? filePathOrUrl.slice(1) : filePathOrUrl;
  
  // Construct URL - Laravel serves files from /storage/{path}
  return `${getBackendBaseUrl()}/storage/${cleanPath}`;
};

/**
 * Get file name from a file path
 */
export const getFileName = (filePath: string | null | undefined): string => {
  if (!filePath) return '';
  return filePath.split('/').pop() || '';
};

/**
 * Get file extension from a file path
 */
export const getFileExtension = (filePath: string | null | undefined): string => {
  if (!filePath) return '';
  const fileName = getFileName(filePath);
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
};

/**
 * Check if file is an image based on extension
 */
export const isImageFile = (filePath: string | null | undefined): boolean => {
  const ext = getFileExtension(filePath);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
};

/**
 * Check if file is a video based on extension
 */
export const isVideoFile = (filePath: string | null | undefined): boolean => {
  const ext = getFileExtension(filePath);
  return ['mp4', 'mov', 'avi', 'webm'].includes(ext);
};

/**
 * Check if file is a PDF based on extension
 */
export const isPdfFile = (filePath: string | null | undefined): boolean => {
  const ext = getFileExtension(filePath);
  return ext === 'pdf';
};

