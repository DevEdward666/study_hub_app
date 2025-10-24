import { useEffect } from "react";
import { pushNotificationService } from "../../services/push-notification.service";

/**
 * Component to initialize push notifications on app startup
 * Place this in your main App component
 */
export const PushNotificationInitializer: React.FC = () => {
  useEffect(() => {
    // Initialize push notifications
    const initPushNotifications = async () => {
      try {
        await pushNotificationService.initialize();
        console.log("Push notifications initialized");
      } catch (error) {
        console.error("Failed to initialize push notifications:", error);
      }
    };

    initPushNotifications();
  }, []);

  return null; // This component doesn't render anything
};

export default PushNotificationInitializer;

