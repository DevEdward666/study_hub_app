import React, { useEffect, useState } from 'react';
import { IonBadge, IonIcon } from '@ionic/react';
import { timeOutline, warningOutline } from 'ionicons/icons';
import './SessionTimer.css';

interface SubscriptionTimerProps {
  startTime: string;
  onTimeUpdate?: (elapsedMinutes: number) => void;
  compact?: boolean;
  showIcon?: boolean;
  remainingHours?: number;
}

export const SubscriptionTimer: React.FC<SubscriptionTimerProps> = ({ 
  startTime, 
  onTimeUpdate,
  compact = false, 
  showIcon = true,
  remainingHours
}) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(startTime).getTime();
      const now = Date.now();
      const elapsed = Math.max(0, now - start);
      
      setElapsedTime(elapsed);
      
      // Calculate remaining time based on subscription hours
      if (remainingHours !== undefined) {
        const elapsedHours = elapsed / (1000 * 60 * 60);
        const remainingFromSubscription = Math.max(0, remainingHours - elapsedHours);
        const remainingMs = remainingFromSubscription * 60 * 60 * 1000;
        setTimeRemaining(remainingMs);
      }
      
      // Notify parent of elapsed minutes
      if (onTimeUpdate) {
        const elapsedMinutes = elapsed / (1000 * 60);
        onTimeUpdate(elapsedMinutes);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, [startTime, onTimeUpdate, remainingHours]); // Added remainingHours to dependencies

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (compact) {
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const getElapsedHours = (): number => {
    return elapsedTime / (1000 * 60 * 60);
  };

  const getCurrentRemaining = (): number => {
    if (remainingHours === undefined) return 0;
    return Math.max(0, remainingHours - getElapsedHours());
  };

  const formatRemainingHours = (): string => {
    const remaining = getCurrentRemaining();
    const totalSeconds = Math.floor(remaining * 3600);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const getTimerColor = (): string => {
    if (remainingHours === undefined) return 'primary';
    
    const remaining = getCurrentRemaining();
    if (remaining < 0.25) return 'danger'; // Less than 25 minutes
    if (remaining < 0.5) return 'warning'; // Less than 30 hour
    return 'success'; // 1 hour or more
  };

  // Show "Time's Up" if no time remaining
  if (timeRemaining === 0 && remainingHours !== undefined) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <IonBadge color="danger" className={`session-timer-badge ${compact ? 'compact' : ''}`}>
          {showIcon && <IonIcon icon={warningOutline} />}
          <span>No Hours Left</span>
        </IonBadge>
        {!compact && (
          <div style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>
            <div>Session: {getElapsedHours().toFixed(2)}h</div>
            <div>Remaining: 0h 0m 0s</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <IonBadge color={getTimerColor()} className={`session-timer-badge ${compact ? 'compact' : ''}`}>
        {showIcon && <IonIcon icon={timeOutline} />}
        <span>{formatTime(timeRemaining)}</span>
      </IonBadge>
      {remainingHours !== undefined && !compact && (
        <div style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>
          <div>Session: {getElapsedHours().toFixed(2)}h</div>
          <div>Remaining: {formatRemainingHours()}</div>
        </div>
      )}
    </div>
  );
};

