import React from 'react';
import { IonSpinner } from '@ionic/react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...',
  size = 'medium'
}) => {
  return (
    <div className={`loading-spinner loading-spinner--${size}`}>
      <IonSpinner name="crescent" />
      {message && <p className="loading-spinner__message">{message}</p>}
    </div>
  );
};