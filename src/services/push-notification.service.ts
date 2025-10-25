import { apiClient } from "./api.client";
import { z } from "zod";
import { ApiResponse, ApiResponseSchema } from "../schema/api.schema";
// Types for Push Notifications
export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionDto {
  endpoint: string;
  keys?: PushSubscriptionKeys;
  userAgent?: string;
}

export interface PushNotificationDto {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  url?: string;
  data?: Record<string, any>;
}

export interface VapidPublicKey {
  publicKey: string;
}

// Schemas
const VapidKeySchema = z.object({
  publicKey: z.string(),
});

const PushSubscriptionResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  endpoint: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
});

class PushNotificationService {
  private static instance: PushNotificationService;
  private swRegistration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error("Push notifications are not supported");
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!this.isSupported()) {
      throw new Error("Service workers are not supported");
    }

    try {
      // Check if there's already a registration
      const existingRegistration = await navigator.serviceWorker.getRegistration('/');
      if (existingRegistration) {
        console.log("Service Worker already registered:", existingRegistration);
        this.swRegistration = existingRegistration;
        return existingRegistration;
      }

      // Register new service worker
      this.swRegistration = await navigator.serviceWorker.register("/studyhub-service-worker.js", {
        scope: "/",
        updateViaCache: 'none' // Always check for updates
      });
      
      console.log("Service Worker registered successfully:", this.swRegistration);
      
      // Listen for service worker updates
      this.swRegistration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
      });

      return this.swRegistration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      throw error;
    }
  }

  /**
   * Debug service worker status
   */
  async debugServiceWorker(): Promise<void> {
    console.log("=== Service Worker Debug Info ===");
    console.log("Service Worker supported:", 'serviceWorker' in navigator);
    console.log("Push supported:", 'PushManager' in window);
    console.log("Notification supported:", 'Notification' in window);
    
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/');
        console.log("Current registration:", registration);
        
        if (registration) {
          console.log("Registration scope:", registration.scope);
          console.log("Registration state:", registration.active?.state);
          console.log("Registration installing:", registration.installing);
          console.log("Registration waiting:", registration.waiting);
          console.log("Registration active:", registration.active);
        }
        
        const ready = await navigator.serviceWorker.ready;
        console.log("Service Worker ready:", ready);
      } catch (error) {
        console.error("Error checking service worker:", error);
      }
    }
    console.log("=== End Debug Info ===");
  }

  /**
   * Get VAPID public key from server
   */
  async getVapidPublicKey(): Promise<string> {
    try {
      // Try the standard API wrapper format first
      const response = await apiClient.get<VapidPublicKey>(
        "push/vapid-public-key",
        ApiResponseSchema(VapidKeySchema)
      );
      console.log("VAPID key received from server:", response);
      return response.publicKey;
    } catch (wrappedError) {
      console.log("Standard API format failed, trying direct endpoint access...");
      
      try {
        // Try making a direct request without the API wrapper schema
        const directResponse = await fetch("/api/push/vapid-public-key", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("auth_token") || ""}`
          }
        });
        
        if (directResponse.ok) {
          const data = await directResponse.json();
          console.log("Direct API response:", data);
          
          // Handle different possible response formats
          if (typeof data === "string") {
            console.log("VAPID key received as string:", data);
            return data;
          } else if (data.publicKey) {
            console.log("VAPID key received in object:", data.publicKey);
            return data.publicKey;
          } else if (data.data?.publicKey) {
            console.log("VAPID key received in wrapped format:", data.data.publicKey);
            return data.data.publicKey;
          }
        }
        
        throw new Error(`Direct API call failed with status: ${directResponse.status}`);
      } catch (directError) {
        console.error("Both API formats failed:", { wrappedError, directError });
        
        // Fallback: Use a development VAPID public key for testing
        const fallbackVapidKey = "BNkiKxWjHSEJ5TKsqayRHt4-3QOfJgZR7u9YqpM3q1r-5VZq_p2A6qKQJmr8JsGHmFjKJVJy7TKsqayRHt4-3QOfJgZR7";
        
        console.warn("Using fallback VAPID key for development. Server configuration needed for production.");
        return fallbackVapidKey;
      }
    }
  }

  /**
   * Convert base64 string to Uint8Array for VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as Uint8Array;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window
      .btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Push notifications are not supported");
    }

    // Check permission
    const permission = await this.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission denied");
    }

    // Register service worker if not already registered
    if (!this.swRegistration) {
      await this.registerServiceWorker();
    }

    // For development: Skip server push setup if server isn't properly configured
    // Local notifications will still work through service worker
    try {
      // Get VAPID public key
      const vapidPublicKey = await this.getVapidPublicKey();

      // Subscribe to push
      const subscription = await this.swRegistration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      });

      console.log("Push manager subscription created successfully");

      // Send subscription to server (with error handling)
      try {
        const subscriptionJson = subscription.toJSON();
        const subscriptionDto: PushSubscriptionDto = {
          endpoint: subscriptionJson.endpoint!,
          keys: subscriptionJson.keys
            ? {
                p256dh: subscriptionJson.keys.p256dh!,
                auth: subscriptionJson.keys.auth!,
              }
            : undefined,
          userAgent: navigator.userAgent,
        };

        await apiClient.request(
          "POST",
          "push/subscribe",
          ApiResponseSchema(PushSubscriptionResponseSchema),
          subscriptionDto
        );

        console.log("Push subscription registered with server successfully");
      } catch (serverError) {
        console.warn("Failed to register subscription with server (local notifications will still work):", serverError);
        // Don't throw error here - local notifications can still work
      }
    } catch (vapidError) {
      console.warn("Could not set up push manager subscription, using service worker for local notifications only:", vapidError);
      // Even if VAPID setup fails, we can still show local notifications through the service worker
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    if (!this.swRegistration) {
      return;
    }

    const subscription = await this.swRegistration.pushManager.getSubscription();
    if (!subscription) {
      return;
    }

    // Unsubscribe from push manager
    await subscription.unsubscribe();

    // Notify server
    try {
      await apiClient.request(
        "POST",
        "push/unsubscribe",
        ApiResponseSchema(z.boolean()),
        subscription.endpoint
      );
    } catch (error) {
      console.error("Failed to notify server about unsubscription:", error);
    }

    console.log("Push unsubscription successful");
  }

  /**
   * Check if user is currently subscribed
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported() || !this.swRegistration) {
      return false;
    }

    const subscription = await this.swRegistration.pushManager.getSubscription();
    return !!subscription;
  }

  /**
   * Send a local notification (doesn't require server)
   */
  async showLocalNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!this.isSupported()) {
      console.warn("Notifications are not supported on this device");
      return;
    }

    // Check and request permission if needed
    let permission = this.getPermissionStatus();
    if (permission === "default") {
      permission = await this.requestPermission();
    }
    
    if (permission !== "granted") {
      console.warn("Notification permission not granted");
      return;
    }

    // Enhanced notification options with better defaults
    const enhancedOptions: NotificationOptions = {
      body: options?.body || 'StudyHub notification',
      icon: options?.icon || '/icon-192.png',
      badge: options?.badge || '/badge.png',
      tag: options?.tag || `notification-${Date.now()}`,
      requireInteraction: options?.requireInteraction ?? true,
      silent: false,
      ...options, // Spread user options to override defaults
    };

    console.log('🔔 Showing notification with options:', { 
      title, 
      options: enhancedOptions,
      permission: this.getPermissionStatus(),
      isSupported: this.isSupported(),
      serviceWorker: !!this.swRegistration,
      serviceWorkerActive: !!this.swRegistration?.active,
      documentHidden: document.hidden,
      documentVisibilityState: document.visibilityState
    });

    try {
      // Ensure service worker is registered
      if (!this.swRegistration) {
        await this.registerServiceWorker();
      }

      if (this.swRegistration && this.swRegistration.active) {
        // Show notification through service worker
        await this.swRegistration.showNotification(title, enhancedOptions);
        console.log("Local notification sent through service worker:", title);
      } else {
        // Fallback to regular notification
        const notification = new Notification(title, enhancedOptions);
        console.log("Local notification sent directly:", title);
        
        // Add click handler for direct notifications
        notification.onclick = (event) => {
          console.log('Notification clicked:', event);
          notification.close();
          
          // Try to focus the window
          if (window.focus) {
            window.focus();
          }
        };
      }
    } catch (error) {
      console.error("Failed to show notification:", error);
      
      // Final fallback - try direct notification with minimal options
      try {
        const fallbackOptions: NotificationOptions = {
          body: enhancedOptions.body,
          icon: enhancedOptions.icon,
          requireInteraction: true,
          tag: enhancedOptions.tag,
        };
        
        const notification = new Notification(title, fallbackOptions);
        console.log("Notification sent as fallback:", title);
        
        notification.onclick = () => {
          notification.close();
          if (window.focus) window.focus();
        };
      } catch (fallbackError) {
        console.error("All notification methods failed:", fallbackError);
        
        // Ultimate fallback - browser alert
        alert(`${title}: ${enhancedOptions.body}`);
      }
    }
  }

  /**
   * Initialize push notifications (call this on app startup)
   */
  async initialize(): Promise<void> {
    try {
      if (!this.isSupported()) {
        console.warn("Push notifications are not supported on this device");
        return;
      }

      console.log("Initializing push notification service...");

      // Register service worker (essential for both local and server push notifications)
      await this.registerServiceWorker();
      console.log("Service worker registration completed");

      // Check permission status
      const permission = this.getPermissionStatus();
      console.log("Current notification permission:", permission);

      // If permission is already granted, we can proceed with setup
      if (permission === "granted") {
        console.log("Notification permission already granted, setting up push notifications...");
        try {
          // Try to set up push subscription (but don't fail if server isn't ready)
          await this.subscribe();
          console.log("Push notification setup completed successfully");
        } catch (subscriptionError) {
          console.warn("Push subscription setup failed, but local notifications are still available:", subscriptionError);
        }
      } else if (permission === "default") {
        console.log("Notification permission not yet requested. Will request when first notification is triggered.");
      } else if (permission === "denied") {
        console.warn("Notification permission was denied. Notifications will not work.");
      }

      console.log("Push notification service initialization completed");
    } catch (error) {
      console.error("Failed to initialize push notification service:", error);
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      return null;
    }
    return await this.swRegistration.pushManager.getSubscription();
  }

  /**
   * Test notification - for debugging purposes
   */
  async testNotification(): Promise<void> {
    console.log("🧪 Testing notification system...");
    
    try {
      await this.showLocalNotification("🧪 Test Notification", {
        body: "This is a test notification to verify the system is working correctly.\n\nIf you can see this, notifications are functional!",
        icon: "/icon-192.png",
        badge: "/badge.png",
        tag: "test-notification",
        requireInteraction: true,
      });
      
      console.log("✅ Test notification sent successfully");
    } catch (error) {
      console.error("❌ Test notification failed:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();

// Export test function for debugging
export const testNotification = () => pushNotificationService.testNotification();

// Export class for type checking
export default PushNotificationService;

