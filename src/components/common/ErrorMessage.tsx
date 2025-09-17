import React from 'react';
import { IonIcon } from '@ionic/react';
import { alertCircleOutline, refreshOutline } from 'ionicons/icons';
import './ErrorMessage.css';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  showIcon?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onRetry,
  showIcon = true 
}) => {
  return (
    <div className="error-message">
      {showIcon && (
        <IonIcon icon={alertCircleOutline} className="error-message__icon" />
      )}
      <p className="error-message__text">{message}</p>
      {onRetry && (
        <button className="error-message__retry" onClick={onRetry}>
          <IonIcon icon={refreshOutline} />
          Retry
        </button>
      )}
    </div>
  );
};