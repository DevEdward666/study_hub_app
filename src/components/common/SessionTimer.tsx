import React, { useEffect, useState, useCallback, useRef } from 'react';
import { IonBadge, IonIcon } from '@ionic/react';
import { timeOutline, warningOutline } from 'ionicons/icons';
import './SessionTimer.css';

interface SessionTimerProps {
  endTime: string;
  onTimeUp?: () => void;
  compact?: boolean;
  showIcon?: boolean;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({ 
  endTime, 
  onTimeUp, 
  compact = false, 
  showIcon = true 
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const hasCalledTimeUp = useRef(false);

  // Memoize the onTimeUp callback to prevent unnecessary re-renders
  const memoizedOnTimeUp = useCallback(onTimeUp || (() => {}), [onTimeUp]);

  useEffect(() => {
    // Reset the flag when endTime changes (new session)
    hasCalledTimeUp.current = false;
    
    console.log(`SessionTimer: New session started with endTime: ${endTime}`);

    const calculateTimeRemaining = () => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, end - now);
      
      setTimeRemaining(remaining);

      // Only call onTimeUp once when time reaches zero
      if (remaining === 0 && !hasCalledTimeUp.current && memoizedOnTimeUp) {
        console.log(`SessionTimer: Time up for session ending at ${endTime}, calling onTimeUp`);
        hasCalledTimeUp.current = true;
        memoizedOnTimeUp();
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endTime, memoizedOnTimeUp]); // Remove hasEnded from dependencies

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

  const getTimerColor = (): string => {
    const totalMinutes = Math.floor(timeRemaining / (1000 * 60));
    if (totalMinutes <= 5) return 'danger';
    if (totalMinutes <= 15) return 'warning';
    return 'success';
  };

  if (timeRemaining === 0) {
    return (
      <IonBadge color="danger" className={`session-timer-badge ended ${compact ? 'compact' : ''}`}>
        {showIcon && <IonIcon icon={warningOutline} />}
        <span>Time's Up</span>
      </IonBadge>
    );
  }

  return (
    <IonBadge color={getTimerColor()} className={`session-timer-badge ${compact ? 'compact' : ''}`}>
      {showIcon && <IonIcon icon={timeOutline} />}
      <span>{formatTime(timeRemaining)}</span>
    </IonBadge>
  );
};
