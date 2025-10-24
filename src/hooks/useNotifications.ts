import { useCallback, useEffect, useRef } from "react";
import { notificationService } from "../services/notification.service";
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

  // Push notification utilities
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  requestPermission: () => Promise<NotificationPermission>;
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

  return {
    notifyCreditPurchase,
    notifySessionStart,
    notifySessionEnd,
    notifySessionWarning,
    notifyCreditApproved,
    setupSessionMonitoring,
    clearSessionMonitoring,
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
  };
};