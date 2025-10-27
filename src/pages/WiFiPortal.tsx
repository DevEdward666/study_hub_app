import React, { useState } from 'react';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonButton,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  useIonToast,
} from '@ionic/react';
import axios from 'axios';

interface WiFiPassword {
  password: string;
  expiresAt: string;
  validMinutes: number;
}

interface ValidationResult {
  isValid: boolean;
  password?: string;
  expiresAt?: string;
  isRedeemed?: boolean;
}

const WiFiPortal: React.FC = () => {
  const [validMinutes, setValidMinutes] = useState<number>(60);
  const [passwordLength, setPasswordLength] = useState<number>(8);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [macAddress, setMacAddress] = useState<string>('');
  const [ttlSeconds, setTtlSeconds] = useState<number>(3600);
  const [loading, setLoading] = useState<boolean>(false);
  const [present] = useIonToast();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://3qrbqpcx-5212.asse.devtunnels.ms";

  // Get auth token for API calls
  const getAuthToken = () => localStorage.getItem("auth_token");

  // Configure axios with auth header
  const makeApiCall = (method: 'get' | 'post', url: string, data?: any) => {
    const token = getAuthToken();
    const config = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    
    if (method === 'get') {
      return axios.get(`${API_BASE}${url}`, config);
    } else {
      return axios.post(`${API_BASE}${url}`, data, config);
    }
  };

  const showToast = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    present({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const response = await makeApiCall('post', 'wifi/request', {
        validMinutes,
        passwordLength,
      });
      
      if (response.data?.password) {
        setGeneratedPassword(response.data.password);
        setPasswordInput(response.data.password);
        setResult(response.data);
        showToast('WiFi password generated successfully!');
      }
    } catch (error: any) {
      setResult({ error: 'Failed to generate password', details: error.message });
      showToast('Failed to generate password', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndCopy = async () => {
    await handleGenerate();
    setTimeout(() => {
      if (generatedPassword) {
        navigator.clipboard?.writeText(generatedPassword);
        showToast('Password copied to clipboard!');
      }
    }, 350);
  };

  const handleValidate = async () => {
    if (!passwordInput.trim()) {
      showToast('Please enter a password to validate', 'warning');
      return;
    }

    try {
      setLoading(true);
      const response = await makeApiCall('get', `wifi/validate?password=${encodeURIComponent(passwordInput)}`);
      setResult(response.data);
      
      if (response.data?.isValid) {
        showToast('Password is valid!');
      } else {
        showToast('Password is invalid or expired', 'warning');
      }
    } catch (error: any) {
      setResult({ error: 'Validation failed', details: error.message });
      showToast('Validation failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!passwordInput.trim()) {
      showToast('Please enter a password to redeem', 'warning');
      return;
    }

    try {
      setLoading(true);
      const response = await makeApiCall('post', `wifi/redeem?password=${encodeURIComponent(passwordInput)}`);
      setResult(response.data);
      showToast('Password redeemed successfully!');
    } catch (error: any) {
      setResult({ error: 'Redemption failed', details: error.message });
      showToast('Redemption failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleWhitelist = async () => {
    if (!macAddress.trim()) {
      showToast('Please enter a MAC address', 'warning');
      return;
    }

    try {
      setLoading(true);
      const response = await makeApiCall('post', '/router/whitelist', {
        macAddress,
        ttlSeconds,
      });
      setResult(response.data);
      showToast('MAC address whitelisted successfully!');
    } catch (error: any) {
      setResult({ error: 'Whitelist failed', details: error.message });
      showToast('Whitelist failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonContent className="ion-padding">
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>📶 WiFi Portal</h1>
        <p style={{ margin: '5px 0 0 0', color: '#666' }}>Manage WiFi access and passwords</p>
      </div>
        {/* Generate Password Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Generate WiFi Password</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel>Valid Minutes</IonLabel>
              <IonSelect
                value={validMinutes}
                onIonChange={(e) => setValidMinutes(e.detail.value)}
              >
                <IonSelectOption value={30}>30 minutes</IonSelectOption>
                <IonSelectOption value={60}>60 minutes</IonSelectOption>
                <IonSelectOption value={180}>3 hours</IonSelectOption>
                <IonSelectOption value={720}>12 hours</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel>Password Length</IonLabel>
              <IonSelect
                value={passwordLength}
                onIonChange={(e) => setPasswordLength(e.detail.value)}
              >
                <IonSelectOption value={6}>6 characters</IonSelectOption>
                <IonSelectOption value={8}>8 characters</IonSelectOption>
                <IonSelectOption value={10}>10 characters</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonButton expand="block" onClick={handleGenerate} disabled={loading}>
                    {loading ? 'Generating...' : 'Get WiFi Password'}
                  </IonButton>
                </IonCol>
                <IonCol>
                  <IonButton expand="block" color="secondary" onClick={handleGenerateAndCopy} disabled={loading}>
                    {loading ? 'Generating...' : 'Get + Copy'}
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Password Input Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Password Management</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Generated / Enter Password</IonLabel>
              <IonInput
                value={passwordInput}
                placeholder="Generated or paste password here"
                onIonInput={(e) => setPasswordInput(e.detail.value || '')}
              />
            </IonItem>

            <IonGrid>
              <IonRow>
                <IonCol>
                  <IonButton expand="block" onClick={handleValidate} disabled={loading}>
                    {loading ? 'Validating...' : 'Validate'}
                  </IonButton>
                </IonCol>
                <IonCol>
                  <IonButton expand="block" color="warning" onClick={handleRedeem} disabled={loading}>
                    {loading ? 'Redeeming...' : 'Redeem (One-time)'}
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>

        {/* Router Whitelist Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Router Whitelist (Optional)</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">MAC Address</IonLabel>
              <IonInput
                value={macAddress}
                placeholder="e.g., 00:11:22:33:44:55"
                onIonInput={(e) => setMacAddress(e.detail.value || '')}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">TTL (seconds)</IonLabel>
              <IonInput
                type="number"
                value={ttlSeconds}
                placeholder="3600"
                onIonInput={(e) => setTtlSeconds(parseInt(e.detail.value || '3600'))}
              />
            </IonItem>

            <IonButton expand="block" onClick={handleWhitelist} style={{ marginTop: '16px' }} disabled={loading}>
              {loading ? 'Whitelisting...' : 'Whitelist MAC'}
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Result Section */}
        {result && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Result</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <pre
                style={{
                  background: '#1e1e1e',
                  color: '#d4d4d4',
                  padding: '12px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '12px',
                }}
              >
                {JSON.stringify(result, null, 2)}
              </pre>
            </IonCardContent>
          </IonCard>
        )}

        {/* Info Card */}
        <IonCard color="light">
          <IonCardContent>
            <IonText color="medium">
              <p style={{ fontSize: '13px', margin: 0 }}>
                <strong>💡 Tips:</strong>
                <br />
                • Generate a WiFi password for customers
                <br />
                • Validate passwords in real-time
                <br />
                • Redeem is one-time use only
                <br />
                • Whitelist MAC for direct router access
                <br />• Passwords auto-expire after set time
              </p>
            </IonText>
          </IonCardContent>
        </IonCard>
    </IonContent>
  );
};

export default WiFiPortal;

