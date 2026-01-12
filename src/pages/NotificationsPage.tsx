import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, CheckCheck, ExternalLink } from 'lucide-react';
import notificationService, { Notification } from '../services/notification.service';
import { Pagination } from '../components/Table';
import toast from 'react-hot-toast';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const response = await notificationService.getNotifications({ 
        page, 
        per_page: 20 
      });
      setNotifications(response.data);
      setTotalPages(response.meta.last_page);
      setCurrentPage(response.meta.current_page);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
    fetchUnreadCount();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      await fetchNotifications(currentPage);
      await fetchUnreadCount();
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await fetchNotifications(currentPage);
      await fetchUnreadCount();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      await fetchNotifications(currentPage);
      await fetchUnreadCount();
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    const actionUrl = notification.data?.data?.action_url;
    if (actionUrl) {
      navigate(actionUrl);
    }
    if (!notification.read_at) {
      handleMarkAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'consultation_paid':
      case 'consultation_booked':
        return '📅';
      case 'milestone_approved':
      case 'milestone_rejected':
        return '✅';
      case 'escrow_released':
        return '💰';
      case 'company_approved':
      case 'company_rejected':
      case 'company_suspended':
        return '🏢';
      case 'dispute_created':
        return '⚠️';
      case 'project_completed':
        return '🎉';
      case 'appeal_submitted':
        return '📝';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    if (type.includes('rejected') || type.includes('suspended') || type.includes('dispute')) {
      return 'text-[#DC2626] bg-[#FEE2E2]';
    }
    if (type.includes('approved') || type.includes('completed') || type.includes('released')) {
      return 'text-[#16A34A] bg-[#D1FAE5]';
    }
    return 'text-[#2563EB] bg-[#DBEAFE]';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A] mx-auto mb-4"></div>
          <p className="text-sm text-[#64748B]">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A]">Notifications</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors text-sm font-medium"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] p-12 text-center">
          <Bell className="w-16 h-16 text-[#94A3B8] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#334155] mb-2">No notifications</h3>
          <p className="text-sm text-[#64748B]">You're all caught up! New notifications will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E7EB] overflow-hidden">
          <div className="divide-y divide-[#E5E7EB]">
            {notifications.map((notification) => {
              const isUnread = !notification.read_at;
              const notificationData = notification.data || {};
              
              return (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-[#F8FAFC] transition-colors ${
                    isUnread ? 'bg-[#EFF6FF]' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${getNotificationColor(notificationData.type || 'default')}`}>
                      {getNotificationIcon(notificationData.type || 'default')}
                    </div>
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-base font-semibold ${isUnread ? 'text-[#1E3A8A]' : 'text-[#334155]'}`}>
                              {notificationData.title || 'Notification'}
                            </h4>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-[#1E3A8A] flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-sm text-[#64748B] mb-2">
                            {notificationData.message || 'No message'}
                          </p>
                          <p className="text-xs text-[#94A3B8]">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.read_at && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="p-2 text-[#64748B] hover:text-[#1E3A8A] hover:bg-[#EFF6FF] rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="p-2 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#E5E7EB]">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  fetchNotifications(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
