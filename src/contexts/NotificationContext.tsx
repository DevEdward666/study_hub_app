import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SessionEndedNotification } from '@/services/signalr.service';

interface NotificationItem extends SessionEndedNotification {
  isRead: boolean;
  receivedAt: Date;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (notification: SessionEndedNotification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  triggerTableRefresh: () => void;
  shouldRefreshTables: boolean;
  resetTableRefresh: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [shouldRefreshTables, setShouldRefreshTables] = useState(false);

  const addNotification = (notification: SessionEndedNotification) => {
    const newNotification: NotificationItem = {
      ...notification,
      isRead: false,
      receivedAt: new Date(),
    };

    setNotifications((prev) => [newNotification, ...prev]);
    
    // Delay table refresh by 10 seconds to allow notification sound and voice to complete
    // Sound duration: ~0.7s (doorbell) + ~2-3s (voice) = ~4s total
    // Adding buffer to 10s for safety
    setTimeout(() => {
      setShouldRefreshTables(true);
    }, 10000); // 10 seconds

    // Store in localStorage for persistence
    const stored = localStorage.getItem('admin-notifications');
    const existing = stored ? JSON.parse(stored) : [];
    const updated = [newNotification, ...existing].slice(0, 100); // Keep last 100
    localStorage.setItem('admin-notifications', JSON.stringify(updated));
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );

    // Update localStorage
    const stored = localStorage.getItem('admin-notifications');
    if (stored) {
      const existing = JSON.parse(stored);
      const updated = existing.map((n: NotificationItem) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      localStorage.setItem('admin-notifications', JSON.stringify(updated));
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    // Update localStorage
    const stored = localStorage.getItem('admin-notifications');
    if (stored) {
      const existing = JSON.parse(stored);
      const updated = existing.map((n: NotificationItem) => ({ ...n, isRead: true }));
      localStorage.setItem('admin-notifications', JSON.stringify(updated));
    }
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem('admin-notifications');
  };

  const triggerTableRefresh = () => {
    setShouldRefreshTables(true);
  };

  const resetTableRefresh = () => {
    setShouldRefreshTables(false);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Load notifications from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem('admin-notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      } catch (error) {
        console.error('Error loading notifications from localStorage:', error);
      }
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        triggerTableRefresh,
        shouldRefreshTables,
        resetTableRefresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

