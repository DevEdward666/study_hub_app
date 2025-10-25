import React, { useState, useEffect } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel, IonBadge } from '@ionic/react';
import { pushNotificationService } from '../../services/push-notification.service';

export const ServiceWorkerDebug: React.FC = () => {
  const [swStatus, setSwStatus] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const checkServiceWorkerStatus = async () => {
    setLoading(true);
    try {
      const status = {
        supported: 'serviceWorker' in navigator,
        pushSupported: 'PushManager' in window,
        notificationSupported: 'Notification' in window,
        permission: Notification.permission,
        registration: null as any,
        ready: false
      };

      if ('serviceWorker' in navigator) {
        try {
          status.registration = await navigator.serviceWorker.getRegistration('/');
          const ready = await navigator.serviceWorker.ready;
          status.ready = !!ready;
        } catch (error) {
          console.error('Error checking SW:', error);
        }
      }

      setSwStatus(status);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const testServiceWorker = async () => {
    try {
      await pushNotificationService.debugServiceWorker();
      await checkServiceWorkerStatus();
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  const registerServiceWorker = async () => {
    try {
      await pushNotificationService.registerServiceWorker();
      await checkServiceWorkerStatus();
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  useEffect(() => {
    checkServiceWorkerStatus();
  }, []);

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Service Worker Debug</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonItem>
          <IonLabel>
            <h3>Service Worker Supported</h3>
          </IonLabel>
          <IonBadge color={swStatus.supported ? 'success' : 'danger'}>
            {swStatus.supported ? 'Yes' : 'No'}
          </IonBadge>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>Push Supported</h3>
          </IonLabel>
          <IonBadge color={swStatus.pushSupported ? 'success' : 'danger'}>
            {swStatus.pushSupported ? 'Yes' : 'No'}
          </IonBadge>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>Notification Permission</h3>
          </IonLabel>
          <IonBadge color={swStatus.permission === 'granted' ? 'success' : swStatus.permission === 'denied' ? 'danger' : 'warning'}>
            {swStatus.permission || 'Unknown'}
          </IonBadge>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>SW Registered</h3>
          </IonLabel>
          <IonBadge color={swStatus.registration ? 'success' : 'danger'}>
            {swStatus.registration ? 'Yes' : 'No'}
          </IonBadge>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>SW Ready</h3>
          </IonLabel>
          <IonBadge color={swStatus.ready ? 'success' : 'danger'}>
            {swStatus.ready ? 'Yes' : 'No'}
          </IonBadge>
        </IonItem>

        {swStatus.registration && (
          <IonItem>
            <IonLabel>
              <h3>SW State</h3>
              <p>{swStatus.registration.active?.state || 'Unknown'}</p>
            </IonLabel>
          </IonItem>
        )}

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <IonButton 
            onClick={checkServiceWorkerStatus} 
            disabled={loading}
            size="small"
          >
            Refresh Status
          </IonButton>
          
          <IonButton 
            onClick={testServiceWorker} 
            disabled={loading}
            size="small"
            color="secondary"
          >
            Debug SW
          </IonButton>
          
          <IonButton 
            onClick={registerServiceWorker} 
            disabled={loading}
            size="small"
            color="tertiary"
          >
            Register SW
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default ServiceWorkerDebug;