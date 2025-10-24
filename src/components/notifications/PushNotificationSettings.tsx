import React, { useEffect } from "react";
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonToggle,
  IonItem,
  IonLabel,
  IonText,
  IonBadge,
  IonList,
  IonListHeader,
} from "@ionic/react";
import { notificationsOutline, checkmarkCircle, alertCircle } from "ionicons/icons";
import { usePushNotification } from "../../hooks/usePushNotification";
import "./PushNotificationSettings.css";

interface PushNotificationSettingsProps {
  autoInitialize?: boolean;
}

export const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({
  autoInitialize = false,
}) => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
  } = usePushNotification();

  // Auto-initialize push notifications if enabled and not subscribed
  useEffect(() => {
    if (autoInitialize && isSupported && permission === "default") {
      // Delay to avoid immediate permission prompt
      const timer = setTimeout(() => {
        requestPermission().catch((err) => {
          console.error("Auto permission request failed:", err);
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoInitialize, isSupported, permission, requestPermission]);

  const handleToggleNotifications = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (err) {
      console.error("Failed to toggle notifications:", err);
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case "granted":
        return <IonBadge color="success">Enabled</IonBadge>;
      case "denied":
        return <IonBadge color="danger">Blocked</IonBadge>;
      default:
        return <IonBadge color="warning">Not Set</IonBadge>;
    }
  };

  if (!isSupported) {
    return (
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={notificationsOutline} /> Push Notifications
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText color="medium">
            <p>Push notifications are not supported on this device or browser.</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard className="push-notification-settings">
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={notificationsOutline} /> Push Notifications
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonList>
          {/* Permission Status */}
          <IonItem lines="none">
            <IonLabel>
              <h3>Notification Permission</h3>
              <p>Current browser permission status</p>
            </IonLabel>
            {getPermissionBadge()}
          </IonItem>

          {/* Subscription Status */}
          {permission === "granted" && (
            <IonItem>
              <IonIcon
                icon={isSubscribed ? checkmarkCircle : alertCircle}
                slot="start"
                color={isSubscribed ? "success" : "warning"}
              />
              <IonLabel>
                <h3>Enable Study Session Notifications</h3>
                <p>Get notified when you start or stop a session</p>
              </IonLabel>
              <IonToggle
                checked={isSubscribed}
                onIonChange={handleToggleNotifications}
                disabled={isLoading}
              />
            </IonItem>
          )}

          {/* Request Permission Button */}
          {permission === "default" && (
            <div className="permission-request">
              <IonText color="medium">
                <p>
                  Allow notifications to stay updated about your study sessions,
                  credit alerts, and important updates.
                </p>
              </IonText>
              <IonButton
                expand="block"
                onClick={requestPermission}
                disabled={isLoading}
              >
                <IonIcon icon={notificationsOutline} slot="start" />
                Enable Notifications
              </IonButton>
            </div>
          )}

          {/* Blocked Instructions */}
          {permission === "denied" && (
            <div className="permission-blocked">
              <IonText color="danger">
                <p>
                  <strong>Notifications are blocked.</strong>
                </p>
                <p>
                  To enable notifications, please update your browser settings:
                </p>
                <ol>
                  <li>Click the lock icon in the address bar</li>
                  <li>Find "Notifications" in the permissions list</li>
                  <li>Change it to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </IonText>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <IonItem color="danger" lines="none">
              <IonLabel className="ion-text-wrap">
                <p>{error}</p>
              </IonLabel>
            </IonItem>
          )}
        </IonList>

        {/* Features List */}
        {isSubscribed && (
          <div className="notification-features">
            <IonListHeader>
              <IonLabel>You'll receive notifications for:</IonLabel>
            </IonListHeader>
            <IonList>
              <IonItem lines="none">
                <IonIcon icon={checkmarkCircle} slot="start" color="success" />
                <IonLabel>Study session start confirmations</IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonIcon icon={checkmarkCircle} slot="start" color="success" />
                <IonLabel>Session completion summaries</IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonIcon icon={checkmarkCircle} slot="start" color="success" />
                <IonLabel>Time remaining alerts</IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonIcon icon={checkmarkCircle} slot="start" color="success" />
                <IonLabel>Credit balance updates</IonLabel>
              </IonItem>
            </IonList>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default PushNotificationSettings;

