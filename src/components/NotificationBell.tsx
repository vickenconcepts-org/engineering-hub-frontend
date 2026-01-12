import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, ExternalLink } from 'lucide-react';
import notificationService, { Notification } from '../services/notification.service';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications({ per_page: 10 });
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (isOpen) {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      await fetchNotifications();
      await fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsLoading(true);
      await notificationService.markAllAsRead();
      await fetchNotifications();
      await fetchUnreadCount();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all notifications as read');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(notificationId);
      await fetchNotifications();
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
      setIsOpen(false);
    }
    if (!notification.read_at) {
      handleMarkAsRead(notification.id);
    }
  };

  // Format relative time
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        className="relative p-2 text-[#64748B] hover:text-[#1E3A8A] hover:bg-[#EFF6FF] transition-all rounded-lg"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-[#DC2626] text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-[#E5E7EB] z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
            <h3 className="text-lg font-semibold text-[#334155]">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isLoading}
                  className="text-sm text-[#1E3A8A] hover:text-[#1D4ED8] font-medium disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#64748B] hover:text-[#334155] p-1 rounded hover:bg-[#F8FAFC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
                <p className="text-[#64748B] text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {notifications.map((notification) => {
                  const isUnread = !notification.read_at;
                  const notificationData = notification.data;
                  
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-[#F8FAFC] cursor-pointer transition-colors ${
                        isUnread ? 'bg-[#EFF6FF]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${getNotificationColor(notificationData.type)}`}>
                          {getNotificationIcon(notificationData.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className={`text-sm font-semibold mb-1 ${isUnread ? 'text-[#1E3A8A]' : 'text-[#334155]'}`}>
                                {notificationData.title}
                              </h4>
                              <p className="text-sm text-[#64748B] line-clamp-2">
                                {notificationData.message}
                              </p>
                              <p className="text-xs text-[#94A3B8] mt-2">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>
                            {isUnread && (
                              <div className="w-2 h-2 rounded-full bg-[#1E3A8A] flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          {!notification.read_at && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="p-1 text-[#64748B] hover:text-[#1E3A8A] hover:bg-[#EFF6FF] rounded transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="p-1 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-[#E5E7EB]">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-sm text-[#1E3A8A] hover:text-[#1D4ED8] font-medium py-2 hover:bg-[#EFF6FF] rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                View all notifications
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
