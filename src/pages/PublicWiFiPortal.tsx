import React, { useState } from 'react';
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
  useIonToast,
} from '@ionic/react';
import axios from 'axios';
import './PublicWiFiPortal.css';

/**
 * Public WiFi Captive Portal Page
 * This is the page customers see when they connect to WiFi
 * No authentication required - public access
 */
const PublicWiFiPortal: React.FC = () => {
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [validated, setValidated] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [present] = useIonToast();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://3qrbqpcx-5212.asse.devtunnels.ms";

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
        `${API_BASE}wifi/validate?password=${encodeURIComponent(password)}`
      );
      console.log(response);
      if (response.data?.valid) {
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
        `${API_BASE}wifi/redeem?password=${encodeURIComponent(password)}`
      );
      console.log(response)
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

          {!validated ? (
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
          ) : (
            // Success Screen
            <IonCard className="success-card">
              <IonCardContent>
                <div className="success-content">
                  <div className="success-icon">✅</div>
                  <h2>Connected!</h2>
                  <IonText color="medium">
                    <p>You now have internet access.</p>
                    <p>Enjoy your time at StudyHub!</p>
                  </IonText>

                  <div className="wifi-info">
                    <IonText color="medium">
                      <p>
                        <small>
                          Your access will expire after the allocated time.
                          <br />
                          Please ask staff if you need extended access.
                        </small>
                      </p>
                    </IonText>
                  </div>

                  <IonButton
                    expand="block"
                    color="success"
                    onClick={() => window.close()}
                    className="close-button"
                  >
                    Close This Window
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

