import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, end - now);
      
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

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
    console.log(totalMinutes)
    if (totalMinutes < 15) return 'danger'; // Less than 15 minutes
    if (totalMinutes < 30) return 'warning'; // Less than 30 minutes
    return 'success'; // 30 minutes or more
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
