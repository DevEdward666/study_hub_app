import React, { useEffect, useState } from 'react';
import { IonBadge, IonIcon } from '@ionic/react';
import { timeOutline, warningOutline } from 'ionicons/icons';
import './SessionTimer.css';

interface SessionTimerProps {
  endTime: string;
  onTimeUp?: () => void;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({ endTime, onTimeUp }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, end - now);
      
      setTimeRemaining(remaining);

      if (remaining === 0 && !hasEnded) {
        setHasEnded(true);
        if (onTimeUp) {
          onTimeUp();
        }
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endTime, hasEnded, onTimeUp]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

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
      <IonBadge color="danger" className="session-timer-badge ended">
        <IonIcon icon={warningOutline} />
        <span>Time's Up</span>
      </IonBadge>
    );
  }

  return (
    <IonBadge color={getTimerColor()} className="session-timer-badge">
      <IonIcon icon={timeOutline} />
      <span>{formatTime(timeRemaining)}</span>
    </IonBadge>
  );
};
