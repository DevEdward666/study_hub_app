import { useCallback, useEffect, useRef } from "react";
import { notificationService } from "../services/notification.service";
import { pushNotificationService } from "../services/push-notification.service";
import { usePushNotification } from "./usePushNotification";

export interface UseNotificationsReturn {
  // Credit purchase notifications
  notifyCreditPurchase: (
    userId: string,
    userName: string,
    amount: number,
    transactionId: string
  ) => Promise<void>;

  // Session notifications
  notifySessionStart: (
    sessionId: string,
    tableNumber: string,
    location: string,
    creditsUsed: number
  ) => Promise<void>;

  notifySessionEnd: (
    sessionId: string,
    tableNumber: string,
    duration: number,
    creditsUsed: number
  ) => Promise<void>;

  notifySessionWarning: (
    sessionId: string,
    tableNumber: string,
    timeRemaining: number
  ) => Promise<void>;

  // Credit approval notifications
  notifyCreditApproved: (
    userId: string,
    transactionId: string,
    amount: number,
    newBalance: number
  ) => Promise<void>;

  // Session monitoring
  setupSessionMonitoring: (
    sessionId: string,
    tableNumber: string,
    startTime: Date,
    durationMinutes: number
  ) => void;

  clearSessionMonitoring: () => void;

    // Push notification properties
  isSupported: boolean;
  permission: NotificationPermission | null;
  isSubscribed: boolean;
  requestPermission: () => Promise<NotificationPermission>;

  // Local notifications with macOS-specific handling
  showLocalNotification: (
    title: string,
    options?: NotificationOptions
  ) => Promise<void>;

  // Test function for debugging
  testNotification: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const sessionMonitoringRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    isSupported,
    permission,
    isSubscribed,
    requestPermission: requestPushPermission,
    showLocalNotification,
  } = usePushNotification();

  // Credit purchase notification (to admins)
  const notifyCreditPurchase = useCallback(
    async (
      userId: string,
      userName: string,
      amount: number,
      transactionId: string
    ) => {
      try {
        await notificationService.notifyCreditPurchase(
          userId,
          userName,
          amount,
          transactionId
        );
      } catch (error) {
        console.error("Failed to send credit purchase notification:", error);
        throw error;
      }
    },
    []
  );

  // Session start notification (to user)
  const notifySessionStart = useCallback(
    async (
      sessionId: string,
      tableNumber: string,
      location: string,
      creditsUsed: number
    ) => {
      try {
        await notificationService.notifySessionStart(
          sessionId,
          tableNumber,
          location,
          creditsUsed
        );
      } catch (error) {
        console.error("Failed to send session start notification:", error);
        throw error;
      }
    },
    []
  );

  // Session end notification (to user)
  const notifySessionEnd = useCallback(
    async (
      sessionId: string,
      tableNumber: string,
      duration: number,
      creditsUsed: number
    ) => {
      try {
        await notificationService.notifySessionEnd(
          sessionId,
          tableNumber,
          duration,
          creditsUsed
        );
      } catch (error) {
        console.error("Failed to send session end notification:", error);
        throw error;
      }
    },
    []
  );

  // Session warning notification (to user)
  const notifySessionWarning = useCallback(
    async (
      sessionId: string,
      tableNumber: string,
      timeRemaining: number
    ) => {
      try {
        await notificationService.notifySessionWarning(
          sessionId,
          tableNumber,
          timeRemaining
        );
      } catch (error) {
        console.error("Failed to send session warning notification:", error);
        throw error;
      }
    },
    []
  );

  // Credit approval notification (to specific user)
  const notifyCreditApproved = useCallback(
    async (
      userId: string,
      transactionId: string,
      amount: number,
      newBalance: number
    ) => {
      try {
        await notificationService.notifyCreditApproved(
          userId,
          transactionId,
          amount,
          newBalance
        );
      } catch (error) {
        console.error("Failed to send credit approval notification:", error);
        throw error;
      }
    },
    []
  );

  // Setup session monitoring for 30-minute warning
  const setupSessionMonitoring = useCallback(
    (
      sessionId: string,
      tableNumber: string,
      startTime: Date,
      durationMinutes: number
    ) => {
      // Clear any existing monitoring
      if (sessionMonitoringRef.current) {
        clearTimeout(sessionMonitoringRef.current);
      }

      // Setup new monitoring
      sessionMonitoringRef.current = notificationService.setupSessionMonitoring(
        sessionId,
        tableNumber,
        startTime,
        durationMinutes
      );
    },
    []
  );

  // Clear session monitoring
  const clearSessionMonitoring = useCallback(() => {
    if (sessionMonitoringRef.current) {
      notificationService.clearSessionMonitoring(sessionMonitoringRef.current);
      sessionMonitoringRef.current = null;
    }
  }, []);

  // Request permission wrapper
  const requestPermission = useCallback(async () => {
    return await requestPushPermission();
  }, [requestPushPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionMonitoringRef.current) {
        clearTimeout(sessionMonitoringRef.current);
      }
    };
  }, []);

  // Enhanced local notification with macOS support
  const showLocalNotificationEnhanced = useCallback(
    async (title: string, options?: NotificationOptions) => {
      // First check if we have permission
      const currentPermission = Notification.permission;
      console.log('🔔 Current notification permission:', currentPermission);
      
      if (currentPermission === 'denied') {
        console.warn('❌ Notifications are blocked. Please enable in browser settings.');
        // Show fallback alert on macOS
        alert(`${title}: ${options?.body || 'Notification'}`);
        return;
      }
      
      if (currentPermission === 'default') {
        console.log('🔔 Requesting notification permission...');
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('❌ Notification permission denied');
          alert(`${title}: ${options?.body || 'Notification'}`);
          return;
        }
      }

      // Enhanced options for macOS
      const macOSOptions: NotificationOptions = {
        body: options?.body || 'Sunny Side Up notification',
        icon: options?.icon || '/icon-192.png',
        badge: options?.badge || '/badge.png',
        tag: options?.tag || `notification-${Date.now()}`,
        requireInteraction: true, // Force interaction on macOS
        silent: false, // Ensure sound on macOS
        dir: 'auto',
        lang: 'en',
        ...options
      };

      console.log('🔔 Showing notification on macOS:', { title, options: macOSOptions });

      try {
        // Try service worker first
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (registration) {
            await registration.showNotification(title, macOSOptions);
            console.log('✅ Notification sent via service worker');
            return;
          }
        }
        
        // Fallback to direct notification
        const notification = new Notification(title, macOSOptions);
        
        // Add event handlers for macOS
        notification.onclick = () => {
          console.log('🖱️ Notification clicked');
          notification.close();
          window.focus(); // Bring window to front on macOS
        };
        
        notification.onshow = () => {
          console.log('👁️ Notification shown');
        };
        
        notification.onerror = (error) => {
          console.error('❌ Notification error:', error);
        };
        
        notification.onclose = () => {
          console.log('❌ Notification closed');
        };
        
        console.log('✅ Direct notification created');
        
      } catch (error) {
        console.error('❌ All notification methods failed:', error);
        // Ultimate fallback for macOS
        alert(`${title}: ${macOSOptions.body}`);
      }
    },
    []
  );

  // Test notification for debugging
  const testNotification = useCallback(async () => {
    console.log('🧪 Testing notification system on macOS...');
    
    // Check macOS-specific settings
    console.log('🖥️ macOS Notification Debug Info:');
    console.log('- Browser:', navigator.userAgent);
    console.log('- Platform:', navigator.platform);
    console.log('- Notification API supported:', 'Notification' in window);
    console.log('- Service Worker supported:', 'serviceWorker' in navigator);
    console.log('- Current permission:', Notification.permission);
    console.log('- Document visibility:', document.visibilityState);
    console.log('- Window focused:', document.hasFocus());
    
    // Check for common macOS issues
    if (navigator.platform.toLowerCase().includes('mac')) {
      console.log('🍎 macOS detected. Common issues:');
      console.log('1. Check System Preferences > Notifications > Browser');
      console.log('2. Disable Do Not Disturb mode');
      console.log('3. Check Focus/Concentration settings');
      console.log('4. Ensure browser notifications are enabled');
    }
    
    await showLocalNotificationEnhanced('🧪 macOS Test Notification', {
      body: 'Testing on macOS...\n\n✅ If you see this, notifications work!\n❌ If not, check System Preferences > Notifications',
      requireInteraction: true,
      tag: 'test-notification-macos',
      dir: 'ltr'
    });
  }, []);

  return {
    notifyCreditPurchase,
    notifySessionStart,
    notifySessionEnd,
    notifySessionWarning,
    notifyCreditApproved,
    setupSessionMonitoring,
    clearSessionMonitoring,
    showLocalNotification: showLocalNotificationEnhanced,
    testNotification,
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
  };
};