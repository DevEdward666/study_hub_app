// src/pages/auth/Register.tsx
import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSpinner,
  IonToast,
  IonBackButton,
  IonButtons,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthHooks';
import { RegisterRequestSchema } from '../../schema/auth.schema';
import { z } from 'zod';
import './Register.css';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const { signUp } = useAuth();
  const history = useHistory();

  const validateForm = (): boolean => {
    try {
      RegisterRequestSchema.parse({ email, password, name });
      
      // Additional password confirmation check
      if (password !== confirmPassword) {
        setErrors({ confirmPassword: 'Passwords do not match' });
        return false;
      }
      
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: {[key: string]: string} = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await signUp.mutateAsync({ email, password, name });
      history.push('/app/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setToastMessage(message);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" />
          </IonButtons>
          <IonTitle>Sign Up</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen className="register-content">
        <div className="register-container">
          <div className="register-header">
            <h1>Create Account</h1>
            <p>Join Sunny Side Up to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            <IonItem className={errors.name ? 'ion-invalid' : ''}>
              <IonLabel position="stacked">Full Name</IonLabel>
              <IonInput
                type="text"
                value={name}
                placeholder="Enter your full name"
                onIonInput={(e) => setName(e.detail.value!)}
                required
              />
            </IonItem>
            {errors.name && (
              <IonText color="danger" className="error-text">
                {errors.name}
              </IonText>
            )}

            <IonItem className={errors.email ? 'ion-invalid' : ''}>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                value={email}
                placeholder="Enter your email"
                onIonInput={(e) => setEmail(e.detail.value!)}
                required
              />
            </IonItem>
            {errors.email && (
              <IonText color="danger" className="error-text">
                {errors.email}
              </IonText>
            )}

            <IonItem className={errors.password ? 'ion-invalid' : ''}>
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                value={password}
                placeholder="Create a password"
                onIonInput={(e) => setPassword(e.detail.value!)}
                required
              />
            </IonItem>
            {errors.password && (
              <IonText color="danger" className="error-text">
                {errors.password}
              </IonText>
            )}

            <IonItem className={errors.confirmPassword ? 'ion-invalid' : ''}>
              <IonLabel position="stacked">Confirm Password</IonLabel>
              <IonInput
                type="password"
                value={confirmPassword}
                placeholder="Confirm your password"
                onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                required
              />
            </IonItem>
            {errors.confirmPassword && (
              <IonText color="danger" className="error-text">
                {errors.confirmPassword}
              </IonText>
            )}

            <IonButton
              expand="block"
              type="submit"
              disabled={signUp.isPending}
              className="register-button"
            >
              {signUp.isPending ? (
                <>
                  <IonSpinner name="crescent" />
                  <span style={{ marginLeft: '8px' }}>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </IonButton>
          </form>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default Register;
