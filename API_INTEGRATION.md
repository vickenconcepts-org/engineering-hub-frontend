# Frontend API Integration Guide

This document describes how the frontend integrates with the backend API, following the standard response format.

## Standard Response Format

All API endpoints return responses in a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": { ... } // Optional
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": { ... } // Optional, for validation errors
}
```

## API Client

The API client (`src/lib/api-client.ts`) handles:
- Standard response format parsing
- Automatic token injection from cookies
- Error handling with toast notifications
- 401 redirects to login

### Usage

```typescript
import apiClient, { extractData } from '@/lib/api-client';

// Make API call
const response = await apiClient.get('/endpoint');
const data = extractData(response); // Extract data from standard format
```

## Authentication

Authentication is handled through the `authService` (`src/services/auth.service.ts`):

- **Login**: `authService.login(credentials)`
- **Register**: `authService.register(data)`
- **Logout**: `authService.logout()`
- **Get Current User**: `authService.getCurrentUser()`

### Token Storage

Tokens are stored in cookies (not localStorage) for better security:
- Cookie name: `auth_token`
- Expires: 7 days
- Secure: HTTPS only in production
- SameSite: Strict

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

For production, update this to your production API URL.

## Error Handling

The API client automatically handles:
- **401 Unauthorized**: Clears token and redirects to login
- **403 Forbidden**: Shows error toast
- **422 Validation Errors**: Shows first validation error
- **Network Errors**: Shows connection error message
- **Other Errors**: Shows error message from backend

All errors are displayed using `react-hot-toast` notifications.

## Making API Calls

### Example: Get Data

```typescript
import apiClient, { extractData, extractMeta } from '@/lib/api-client';

const response = await apiClient.get('/client/consultations');
const consultations = extractData(response);
const pagination = extractMeta(response);
```

### Example: Post Data

```typescript
import apiClient, { extractData } from '@/lib/api-client';
import toast from 'react-hot-toast';

try {
  const response = await apiClient.post('/client/consultations', {
    company_id: 1,
    scheduled_at: '2024-01-01 10:00:00',
  });
  const consultation = extractData(response);
  toast.success('Consultation booked successfully!');
} catch (error) {
  // Error already handled by interceptor
}
```

### Example: Handle Validation Errors

```typescript
import apiClient, { extractErrors } from '@/lib/api-client';

try {
  await apiClient.post('/endpoint', data);
} catch (error: any) {
  if (error.response?.status === 422) {
    const errors = extractErrors(error.response);
    // Handle specific field errors
    if (errors.email) {
      // Show email-specific error
    }
  }
}
```

## Authentication Flow

1. **Login/Register**: User submits credentials
2. **Token Received**: Backend returns token in response
3. **Token Stored**: Token saved in cookie via `setAuthToken()`
4. **Subsequent Requests**: Token automatically added to Authorization header
5. **Token Expired**: 401 response triggers logout and redirect

## Protected Routes

The `App.tsx` component checks authentication on mount:
- If token exists in cookie, fetches current user
- If fetch succeeds, user is authenticated
- If fetch fails (401), user is logged out

## CORS Configuration

The backend CORS is configured to allow requests from:
- `localhost:3000` (frontend dev server)
- Other domains configured in `SANCTUM_STATEFUL_DOMAINS`

Ensure your backend `.env` includes:
```env
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1,127.0.0.1:8000
```

## Next Steps

To integrate additional endpoints:
1. Create service files in `src/services/` (e.g., `consultation.service.ts`)
2. Use `apiClient` to make requests
3. Use `extractData()`, `extractMessage()`, etc. to parse responses
4. Handle errors appropriately (most handled by interceptor)

