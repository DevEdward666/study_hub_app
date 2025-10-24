import { useState, useEffect, useCallback } from "react";
import { pushNotificationService } from "../services/push-notification.service";

export interface UsePushNotificationReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
  showLocalNotification: (
    title: string,
    options?: NotificationOptions
  ) => Promise<void>;
}

export const usePushNotification = (): UsePushNotificationReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check support and initial state
  useEffect(() => {
    const checkSupport = async () => {
      const supported = pushNotificationService.isSupported();
      setIsSupported(supported);

      if (supported) {
        setPermission(pushNotificationService.getPermissionStatus());
        
        try {
          const subscribed = await pushNotificationService.isSubscribed();
          setIsSubscribed(subscribed);
        } catch (err) {
          console.error("Failed to check subscription status:", err);
        }
      }
    };

    checkSupport();
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await pushNotificationService.subscribe();
      setIsSubscribed(true);
      setPermission(pushNotificationService.getPermissionStatus());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to subscribe";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await pushNotificationService.unsubscribe();
      setIsSubscribed(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unsubscribe";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const perm = await pushNotificationService.requestPermission();
      setPermission(perm);
      return perm;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to request permission";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Show local notification
  const showLocalNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      setError(null);

      try {
        await pushNotificationService.showLocalNotification(title, options);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to show notification";
        setError(message);
        throw err;
      }
    },
    []
  );

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
    showLocalNotification,
  };
};

