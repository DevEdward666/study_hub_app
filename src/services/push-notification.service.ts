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
      this.swRegistration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log("Service Worker registered successfully");
      return this.swRegistration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      throw error;
    }
  }

  /**
   * Get VAPID public key from server
   */
  async getVapidPublicKey(): Promise<string> {
    const response = await apiClient.request<VapidPublicKey>(
      "GET",
      "push/vapid-public-key",
      ApiResponseSchema(VapidKeySchema)
    );
    return response.publicKey;
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

    // Get VAPID public key
    const vapidPublicKey = await this.getVapidPublicKey();

    // Subscribe to push
    const subscription = await this.swRegistration!.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
    });

    // Send subscription to server
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

    console.log("Push subscription successful");
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
      throw new Error("Notifications are not supported");
    }

    const permission = this.getPermissionStatus();
    if (permission !== "granted") {
      throw new Error("Notification permission not granted");
    }

    if (this.swRegistration) {
      // Show notification through service worker
      await this.swRegistration.showNotification(title, options);
    } else {
      // Fallback to regular notification
      new Notification(title, options);
    }
  }

  /**
   * Initialize push notifications (call this on app startup)
   */
  async initialize(): Promise<void> {
    try {
      if (!this.isSupported()) {
        console.warn("Push notifications are not supported");
        return;
      }

      // Register service worker
      await this.registerServiceWorker();

      // Check if already subscribed
      const isSubscribed = await this.isSubscribed();
      console.log("Push notification subscription status:", isSubscribed);

      // If not subscribed and permission is granted, subscribe
      if (!isSubscribed && this.getPermissionStatus() === "granted") {
        await this.subscribe();
      }
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
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
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();

// Export class for type checking
export default PushNotificationService;

