import { pushNotificationService } from "./push-notification.service";
import { apiClient } from "./api.client";
import { z } from "zod";
import { ApiResponseSchema } from "../schema/api.schema";

// Notification types for different events
export enum NotificationType {
  CREDIT_PURCHASE = "credit_purchase",
  SESSION_START = "session_start", 
  SESSION_END = "session_end",
  SESSION_WARNING = "session_warning", // 30 minutes left
  CREDIT_APPROVED = "credit_approved"
}

// Notification payload interfaces
export interface CreditPurchaseNotification {
  type: NotificationType.CREDIT_PURCHASE;
  userId: string;
  userName: string;
  amount: number;
  transactionId: string;
  timestamp: string;
}

export interface SessionStartNotification {
  type: NotificationType.SESSION_START;
  userId: string;
  sessionId: string;
  tableNumber: string;
  location: string;
  creditsUsed: number;
  timestamp: string;
}

export interface SessionEndNotification {
  type: NotificationType.SESSION_END;
  userId: string;
  sessionId: string;
  tableNumber: string;
  duration: number; // in minutes
  creditsUsed: number;
  timestamp: string;
}

export interface SessionWarningNotification {
  type: NotificationType.SESSION_WARNING;
  userId: string;
  sessionId: string;
  tableNumber: string;
  timeRemaining: number; // in minutes
  timestamp: string;
}

export interface CreditApprovedNotification {
  type: NotificationType.CREDIT_APPROVED;
  userId: string;
  transactionId: string;
  amount: number;
  newBalance: number;
  timestamp: string;
}

export type NotificationPayload = 
  | CreditPurchaseNotification
  | SessionStartNotification
  | SessionEndNotification
  | SessionWarningNotification
  | CreditApprovedNotification;

// Server notification request
export interface SendNotificationRequest {
  type: NotificationType;
  targetUserId?: string; // If specified, send only to this user
  targetRole?: 'admin' | 'user'; // If specified, send to all users with this role
  payload: NotificationPayload;
}

class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Send notification for credit purchase (to admins)
   */
  async notifyCreditPurchase(
    userId: string,
    userName: string,
    amount: number,
    transactionId: string
  ): Promise<void> {
    const payload: CreditPurchaseNotification = {
      type: NotificationType.CREDIT_PURCHASE,
      userId,
      userName,
      amount,
      transactionId,
      timestamp: new Date().toISOString()
    };

    // Send to admins via server
    await this.sendServerNotification({
      type: NotificationType.CREDIT_PURCHASE,
      targetRole: 'admin',
      payload
    });

    console.log(`Credit purchase notification sent for user ${userName}: ${amount} credits`);
  }

  /**
   * Send notification for session start (to user only)
   */
  async notifySessionStart(
    sessionId: string,
    tableNumber: string,
    location: string,
    creditsUsed: number
  ): Promise<void> {
    const payload: SessionStartNotification = {
      type: NotificationType.SESSION_START,
      userId: '', // Will be filled by server
      sessionId,
      tableNumber,
      location,
      creditsUsed,
      timestamp: new Date().toISOString()
    };

    // Send local notification immediately
    if (pushNotificationService.isSupported() && 
        pushNotificationService.getPermissionStatus() === "granted") {
      try {
        await pushNotificationService.showLocalNotification(
          "Study Session Started! 📚",
          {
            body: `Table ${tableNumber} at ${location}\n${creditsUsed} credits used`,
            icon: "/icon.png",
            badge: "/badge.png",
            tag: "session-start",
            data: payload,
          }
        );
      } catch (error) {
        console.error("Failed to show local session start notification:", error);
      }
    }

    console.log(`Session start notification sent for table ${tableNumber}`);
  }

  /**
   * Send notification for session end (to user only)
   */
  async notifySessionEnd(
    sessionId: string,
    tableNumber: string,
    duration: number,
    creditsUsed: number
  ): Promise<void> {
    const payload: SessionEndNotification = {
      type: NotificationType.SESSION_END,
      userId: '', // Will be filled by server
      sessionId,
      tableNumber,
      duration,
      creditsUsed,
      timestamp: new Date().toISOString()
    };

    // Send local notification immediately
    if (pushNotificationService.isSupported() && 
        pushNotificationService.getPermissionStatus() === "granted") {
      try {
        const durationHours = Math.floor(duration / 60);
        const remainingMinutes = duration % 60;
        const durationText = durationHours > 0 
          ? `${durationHours}h ${remainingMinutes}m`
          : `${duration}m`;

        await pushNotificationService.showLocalNotification(
          "Study Session Completed! 🎉",
          {
            body: `Great work! You studied for ${durationText} at Table ${tableNumber}.\n${creditsUsed} credits used. Keep up the momentum!`,
            icon: "/icon.png",
            badge: "/badge.png",
            tag: "session-end",
            data: payload,
          }
        );
      } catch (error) {
        console.error("Failed to show local session end notification:", error);
      }
    }

    console.log(`Session end notification sent for table ${tableNumber}, duration: ${duration}m`);
  }

  /**
   * Send notification for session time warning (to user only)
   */
  async notifySessionWarning(
    sessionId: string,
    tableNumber: string,
    timeRemaining: number
  ): Promise<void> {
    const payload: SessionWarningNotification = {
      type: NotificationType.SESSION_WARNING,
      userId: '', // Will be filled by server
      sessionId,
      tableNumber,
      timeRemaining,
      timestamp: new Date().toISOString()
    };

    // Send local notification immediately
    if (pushNotificationService.isSupported() && 
        pushNotificationService.getPermissionStatus() === "granted") {
      try {
        await pushNotificationService.showLocalNotification(
          "⏰ Session Time Warning",
          {
            body: `You have ${timeRemaining} minutes remaining at Table ${tableNumber}.\nPlan to wrap up your study session soon.`,
            icon: "/icon.png",
            badge: "/badge.png",
            tag: "session-warning",
            data: payload,
            requireInteraction: true, // Keep notification visible
          }
        );
      } catch (error) {
        console.error("Failed to show local session warning notification:", error);
      }
    }

    console.log(`Session warning notification sent for table ${tableNumber}, ${timeRemaining}m remaining`);
  }

  /**
   * Send notification for credit approval (to specific user)
   */
  async notifyCreditApproved(
    userId: string,
    transactionId: string,
    amount: number,
    newBalance: number
  ): Promise<void> {
    const payload: CreditApprovedNotification = {
      type: NotificationType.CREDIT_APPROVED,
      userId,
      transactionId,
      amount,
      newBalance,
      timestamp: new Date().toISOString()
    };

    // Send to specific user via server
    await this.sendServerNotification({
      type: NotificationType.CREDIT_APPROVED,
      targetUserId: userId,
      payload
    });

    console.log(`Credit approval notification sent to user ${userId}: ${amount} credits approved`);
  }

  /**
   * Send notification via server (for admin notifications and cross-device delivery)
   */
  private async sendServerNotification(request: SendNotificationRequest): Promise<void> {
    try {
      await apiClient.request(
        "POST",
        "notifications/send",
        ApiResponseSchema(z.boolean()),
        request
      );
    } catch (error) {
      console.error("Failed to send server notification:", error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Setup session monitoring for time warnings
   * This should be called when a session starts
   */
  setupSessionMonitoring(
    sessionId: string,
    tableNumber: string,
    startTime: Date,
    durationMinutes: number
  ): NodeJS.Timeout {
    // Calculate when to show warning (30 minutes before end)
    const warningTime = durationMinutes - 30;
    
    if (warningTime <= 0) {
      console.log("Session too short for warning notification");
      return setTimeout(() => {}, 0); // Return dummy timeout
    }

    const warningTimeMs = warningTime * 60 * 1000;
    
    console.log(`Setting up session warning for ${warningTime} minutes from now`);
    
    return setTimeout(() => {
      this.notifySessionWarning(sessionId, tableNumber, 30);
    }, warningTimeMs);
  }

  /**
   * Clear session monitoring (call when session ends early)
   */
  clearSessionMonitoring(timeoutId: NodeJS.Timeout): void {
    clearTimeout(timeoutId);
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Export class for type checking
export default NotificationService;