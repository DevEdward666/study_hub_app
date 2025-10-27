import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  IonBadge,
  IonProgressBar,
  useIonToast,
} from '@ionic/react';
import axios from 'axios';
import './PublicWiFiPortal.css';

/**
 * Enhanced Public WiFi Captive Portal Page
 * Features:
 * - Password validation and redemption
 * - Recurring validation every 60 seconds  
 * - Countdown timer showing time remaining
 * - Expiration warnings at 5 minutes
 * - Session expired screen
 * - Better user awareness of time limits
 */
const PublicWiFiPortal: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [validated, setValidated] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [minutesLeft, setMinutesLeft] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [present] = useIonToast();
  
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentPasswordRef = useRef<string>('');

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://3qrbqpcx-5212.asse.devtunnels.ms";

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Calculate time remaining
  useEffect(() => {
    if (!expiresAt || sessionExpired) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        setSessionExpired(true);
        setMinutesLeft(0);
        if (validationIntervalRef.current) {
          clearInterval(validationIntervalRef.current);
        }
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
        showToast('Your session has expired', 'warning');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setMinutesLeft(hours * 60 + minutes);

      // Show warning when 5 minutes or less remaining
      if (minutes <= 5 && hours === 0 && !showWarning) {
        setShowWarning(true);
        showToast(`Only ${minutes} minutes remaining!`, 'warning');
      }

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [expiresAt, sessionExpired, showWarning]);

  // Recurring validation every 60 seconds
  useEffect(() => {
    if (!validated || sessionExpired || !currentPasswordRef.current) return;

    const validateSession = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/wifi/validate?password=${encodeURIComponent(currentPasswordRef.current)}`
        );

        if (!response.data?.valid) {
          setSessionExpired(true);
          showToast('Your session has expired', 'warning');
          if (validationIntervalRef.current) {
            clearInterval(validationIntervalRef.current);
          }
        }
      } catch (error) {
        console.error('Validation check failed:', error);
      }
    };

    // Validate every 60 seconds
    validationIntervalRef.current = setInterval(validateSession, 60000);

    return () => {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
      }
    };
  }, [validated, sessionExpired, API_BASE]);

  const showToast = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    present({
      message,
      duration: 4000,
      color,
      position: 'top',
    });
  };

  const handleValidate = async () => {
    if (!password.trim()) {
      showToast('Please enter your access code', 'warning');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.get(
        `${API_BASE}/wifi/validate?password=${encodeURIComponent(password)}`
      );

      if (response.data?.valid) {
        // Store password for recurring validation
        currentPasswordRef.current = password;
        
        // Set expiration time
        if (response.data.expiresAtUtc) {
          setExpiresAt(new Date(response.data.expiresAtUtc));
        }

        // Password is valid, now redeem it
        await handleRedeem();
      } else {
        setErrorMsg('Invalid or expired access code. Please check with staff.');
        showToast('Access code is invalid or has expired', 'danger');
      }
    } catch (error: any) {
      setErrorMsg('Unable to validate access code. Please try again.');
      showToast('Validation failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    try {
      const response = await axios.post(
        `${API_BASE}/wifi/redeem?password=${encodeURIComponent(password)}`
      );

      if (response.data?.redeemed) {
        setValidated(true);
        showToast('Welcome! You now have internet access', 'success');
      } else {
        setErrorMsg('This access code has already been used.');
        showToast('Access code already used', 'danger');
      }
    } catch (error: any) {
      setErrorMsg('Unable to activate access. Please check with staff.');
      showToast('Redemption failed', 'danger');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValidate();
    }
  };

  const handleExtendAccess = () => {
    showToast('Please ask our staff for extended access', 'warning');
  };

  return (
    <IonPage>
      <IonContent className="public-wifi-portal">
        <div className="portal-container">
          {/* Logo/Branding */}
          <div className="portal-header">
            <div className="logo">
              <h1>📚 StudyHub</h1>
            </div>
            <p className="tagline">Welcome to our WiFi network</p>
          </div>

          {!validated && !sessionExpired ? (
            // Access Code Entry Form
            <IonCard className="access-card">
              <IonCardHeader>
                <IonCardTitle>WiFi Access</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="form-content">
                  <IonText color="medium">
                    <p>Enter the access code provided by our staff:</p>
                  </IonText>

                  <div className="input-wrapper">
                    <IonInput
                      value={password}
                      placeholder="Enter your access code"
                      onIonInput={(e) => setPassword(e.detail.value || '')}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                      className="access-input"
                      type="text"
                      autofocus
                    />
                  </div>

                  {errorMsg && (
                    <IonText color="danger">
                      <p className="error-message">⚠️ {errorMsg}</p>
                    </IonText>
                  )}

                  <IonButton
                    expand="block"
                    onClick={handleValidate}
                    disabled={loading || !password.trim()}
                    className="connect-button"
                  >
                    {loading ? (
                      <>
                        <IonSpinner name="crescent" />
                        <span style={{ marginLeft: '8px' }}>Connecting...</span>
                      </>
                    ) : (
                      'Connect to WiFi'
                    )}
                  </IonButton>

                  <div className="help-text">
                    <IonText color="medium">
                      <p>
                        <small>
                          Don't have an access code? Please ask our staff for assistance.
                        </small>
                      </p>
                    </IonText>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          ) : sessionExpired ? (
            // Session Expired Screen
            <IonCard className="expired-card">
              <IonCardContent>
                <div className="expired-content">
                  <div className="expired-icon">⏰</div>
                  <h2>Session Expired</h2>
                  <IonText color="medium">
                    <p>Your WiFi access time has expired.</p>
                    <p>Thank you for visiting StudyHub!</p>
                  </IonText>

                  <div className="expired-info">
                    <IonText color="medium">
                      <p>
                        <small>
                          Need more time? Please ask our staff for an access code extension.
                        </small>
                      </p>
                    </IonText>
                  </div>

                  <IonButton
                    expand="block"
                    color="warning"
                    onClick={() => {
                      setSessionExpired(false);
                      setValidated(false);
                      setPassword('');
                      setExpiresAt(null);
                      currentPasswordRef.current = '';
                    }}
                    className="renew-button"
                  >
                    Get New Access Code
                  </IonButton>

                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={() => window.close()}
                    style={{ marginTop: '10px' }}
                  >
                    Close Window
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ) : (
            // Success Screen with Countdown
            <IonCard className="success-card">
              <IonCardContent>
                <div className="success-content">
                  <div className="success-icon">✅</div>
                  <h2>Connected!</h2>
                  <IonText color="medium">
                    <p>You now have internet access.</p>
                    <p>Enjoy your time at StudyHub!</p>
                  </IonText>

                  {/* Countdown Timer */}
                  <div className="countdown-wrapper">
                    <div className="countdown-display">
                      <IonText>
                        <h3>Time Remaining</h3>
                      </IonText>
                      <div className="time-badge">
                        <IonBadge 
                          color={minutesLeft <= 5 ? 'danger' : minutesLeft <= 15 ? 'warning' : 'success'}
                          className="time-remaining-badge"
                        >
                          {timeRemaining}
                        </IonBadge>
                      </div>
                      <IonProgressBar
                        value={minutesLeft / 60}
                        color={minutesLeft <= 5 ? 'danger' : minutesLeft <= 15 ? 'warning' : 'success'}
                      />
                    </div>
                  </div>

                  {showWarning && (
                    <div className="warning-box">
                      <IonText color="warning">
                        <p>
                          <strong>⚠️ Your session is about to expire!</strong>
                          <br />
                          <small>Ask staff for extended access if needed.</small>
                        </p>
                      </IonText>
                    </div>
                  )}

                  <div className="wifi-info">
                    <IonText color="medium">
                      <p>
                        <small>
                          <strong>Important:</strong> Keep this page open to see your remaining time.
                          <br />
                          Your access will automatically expire when the timer reaches zero.
                          <br />
                          Please disconnect when your time is up.
                        </small>
                      </p>
                    </IonText>
                  </div>

                  <IonButton
                    expand="block"
                    color="primary"
                    fill="outline"
                    onClick={handleExtendAccess}
                    className="extend-button"
                  >
                    Need More Time?
                  </IonButton>

                  <IonButton
                    expand="block"
                    color="medium"
                    fill="clear"
                    onClick={() => window.close()}
                    style={{ marginTop: '10px' }}
                  >
                    Minimize This Window
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Terms & Conditions */}
          <div className="terms">
            <IonText color="medium">
              <p>
                <small>
                  By using our WiFi, you agree to our{' '}
                  <a href="/terms" target="_blank">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank">
                    Privacy Policy
                  </a>
                  .
                </small>
              </p>
            </IonText>
          </div>

          {/* Footer */}
          <div className="portal-footer">
            <IonText color="medium">
              <p>
                <small>© 2025 StudyHub. All rights reserved.</small>
              </p>
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PublicWiFiPortal;

