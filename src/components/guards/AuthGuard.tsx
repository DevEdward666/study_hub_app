import React from 'react';
import { Redirect  } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { useAuth } from '../../hooks/AuthHooks';
import './AuthGuard.css';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
 
  if (isLoading) {
    return (
      <div className="auth-guard-loading">
        <IonSpinner name="crescent" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
};
