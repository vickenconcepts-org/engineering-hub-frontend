import apiClient, { extractData, extractMeta } from '../lib/api-client';

export interface Notification {
  id: string;
  type: string;
  data: {
    type: string;
    title: string;
    message: string;
    data: Record<string, any>;
  };
  read_at: string | null;
  created_at: string;
}

export interface NotificationResponse {
  data: Notification[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface UnreadCountResponse {
  count: number;
}

class NotificationService {
  /**
   * Get user's notifications
   */
  async getNotifications(params?: {
    page?: number;
    per_page?: number;
    mark_as_read?: boolean;
  }): Promise<NotificationResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.mark_as_read) queryParams.append('mark_as_read', 'true');

    const response = await apiClient.get(`/notifications?${queryParams.toString()}`);
    const data = extractData<Notification[]>(response);
    const meta = extractMeta(response);
    
    return {
      data,
      meta: {
        current_page: meta.current_page || 1,
        last_page: meta.last_page || 1,
        per_page: meta.per_page || 20,
        total: meta.total || 0,
        from: meta.from || 0,
        to: meta.to || 0,
      },
    };
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/notifications/unread-count');
    const data = extractData<UnreadCountResponse>(response);
    return data.count;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.post(`/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/mark-all-read');
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  }
}

export default new NotificationService();
