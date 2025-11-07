import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonBadge,
  IonButtons,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/react';
import {
  notificationsOutline,
  checkmarkDoneOutline,
  trashOutline,
  timeOutline,
  checkmarkCircleOutline,
  ellipseOutline,
  volumeHighOutline,
} from 'ionicons/icons';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import './NotificationsPage.css';

type FilterType = 'all' | 'unread' | 'read';

const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotificationContext();

  const [filter, setFilter] = useState<FilterType>('all');

  // Test notification sound function
  const testNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Doorbell chime pattern
      const notes = [
        { frequency: 523.25, time: 0, duration: 0.2 },      // C5
        { frequency: 659.25, time: 0.15, duration: 0.2 },   // E5
        { frequency: 783.99, time: 0.3, duration: 0.4 }     // G5
      ];

      notes.forEach(note => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = note.frequency;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + note.time;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.7, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration);
      });
      
      // Test voice announcement
      if ('speechSynthesis' in window) {
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(
            "Attention! Table 5 session has ended."
          );
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
        }, 800);
      }
      
      console.log("🔔 Test notification sound played!");
    } catch (error) {
      console.error('Error playing test sound:', error);
      alert('Error playing sound. Please click anywhere on the page first and try again.');
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    // Notifications are already in context, just complete the refresh
    setTimeout(() => {
      event.detail.complete();
    }, 500);
  };

  const formatTimeAgo = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            Notifications
            {unreadCount > 0 && (
              <IonBadge color="danger" className="notification-count-badge">
                {unreadCount}
              </IonBadge>
            )}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={testNotificationSound} color="primary" title="Test notification sound">
              <IonIcon icon={volumeHighOutline} />
            </IonButton>
            {notifications.length > 0 && (
              <>
                <IonButton onClick={markAllAsRead} title="Mark all as read">
                  <IonIcon icon={checkmarkDoneOutline} />
                </IonButton>
                <IonButton onClick={clearAll} color="danger" title="Clear all">
                  <IonIcon icon={trashOutline} />
                </IonButton>
              </>
            )}
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={filter} onIonChange={(e) => setFilter(e.detail.value as FilterType)}>
            <IonSegmentButton value="all">
              <IonLabel>All ({notifications.length})</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="unread">
              <IonLabel>Unread ({unreadCount})</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="read">
              <IonLabel>Read ({notifications.length - unreadCount})</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <IonIcon icon={notificationsOutline} className="empty-icon" />
            <h2>No notifications</h2>
            <p>
              {filter === 'unread'
                ? "You're all caught up!"
                : filter === 'read'
                ? 'No read notifications'
                : 'Session end notifications will appear here'}
            </p>
          </div>
        ) : (
          <IonList>
            {filteredNotifications.map((notification) => (
              <IonCard
                key={notification.id}
                className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
              >
                <IonCardHeader>
                  <div className="notification-header">
                    <div className="notification-title-row">
                      <IonIcon
                        icon={notification.isRead ? checkmarkCircleOutline : ellipseOutline}
                        color={notification.isRead ? 'medium' : 'primary'}
                        className="notification-status-icon"
                      />
                      <IonCardTitle className="notification-title">
                        Table {notification.tableNumber}
                      </IonCardTitle>
                      {!notification.isRead && (
                        <IonBadge color="primary" className="unread-badge">
                          New
                        </IonBadge>
                      )}
                    </div>
                    <div className="notification-time">
                      <IonIcon icon={timeOutline} />
                      <span>{formatTimeAgo(notification.receivedAt)}</span>
                    </div>
                  </div>
                </IonCardHeader>

                <IonCardContent>
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    
                    <div className="notification-details">
                      <div className="detail-item">
                        <strong>Customer:</strong> {notification.userName}
                      </div>
                      <div className="detail-item">
                        <strong>Duration:</strong> {formatDuration(notification.duration)}
                      </div>
                      <div className="detail-item">
                        <strong>Amount:</strong> ₱{notification.amount.toFixed(2)}
                      </div>
                    </div>

                    {!notification.isRead && (
                      <IonButton
                        size="small"
                        fill="clear"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="mark-read-btn"
                      >
                        <IonIcon slot="start" icon={checkmarkCircleOutline} />
                        Mark as read
                      </IonButton>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default NotificationsPage;

