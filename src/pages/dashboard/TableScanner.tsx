import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonText,
  IonToast,
  IonAlert,
} from '@ionic/react';
import {
  qrCodeOutline,
  cameraOutline,
  closeOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useQRScanner } from '../../hooks/QrScannerHooks';
import { useTableByQR } from '../../hooks/TableHooks';
import { useTables } from '../../hooks/TableHooks';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import './TableScanner.css';

const TableScanner: React.FC = () => {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  
  const history = useHistory();
  const { startScan, stopScan, isScanning, hasPermission, checkPermission } = useQRScanner();
  const { data: scannedTable, isLoading: isLoadingTable } = useTableByQR(scannedCode);
  const { startSession, activeSession } = useTables();

  React.useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const handleStartScan = async () => {
    if (activeSession) {
      setToastMessage('Please end your current session before starting a new one');
      setShowToast(true);
      return;
    }

    try {
      const result = await startScan();
      if (result) {
        setScannedCode(result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to scan QR code';
      setToastMessage(message);
      setShowToast(true);
    }
  };

  const handleStopScan = async () => {
    await stopScan();
  };

  const handleStartSession = async () => {
    if (scannedTable && scannedCode) {
      try {
        await startSession.mutateAsync({
          tableId: scannedTable.id,
          qrCode: scannedCode,
        });
        setShowConfirmAlert(false);
        history.push('/app/dashboard');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to start session';
        setToastMessage(message);
        setShowToast(true);
      }
    }
  };

  React.useEffect(() => {
    if (scannedTable && scannedCode) {
      setShowConfirmAlert(true);
    }
  }, [scannedTable, scannedCode]);

  if (hasPermission === false) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>QR Scanner</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="scanner-content">
          <div className="scanner-container">
            <IonCard className="permission-card">
              <IonCardContent>
                <div className="permission-content">
                  <IonIcon icon={cameraOutline} className="permission-icon" />
                  <h2>Camera Permission Required</h2>
                  <p>Please allow camera access to scan QR codes</p>
                  <IonButton expand="block" onClick={checkPermission}>
                    Grant Permission
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>QR Scanner</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen className="scanner-content">
        <div className="scanner-container">
          {!isScanning && !scannedCode && (
            <div className="scanner-idle">
              <IonCard className="scanner-card">
                <IonCardContent>
                  <div className="scanner-idle-content">
                    <IonIcon icon={qrCodeOutline} className="scanner-icon" />
                    <h2>Scan Table QR Code</h2>
                    <p>Point your camera at a table QR code to start a study session</p>
                    
                    <IonButton
                      expand="block"
                      size="large"
                      onClick={handleStartScan}
                      className="scan-button"
                    >
                      <IonIcon icon={cameraOutline} slot="start" />
                      Start Scanning
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          )}

          {isScanning && (
            <div className="scanner-active">
              <div className="scanner-overlay">
                <div className="scanner-frame">
                  <div className="scanner-corners">
                    <div className="corner top-left"></div>
                    <div className="corner top-right"></div>
                    <div className="corner bottom-left"></div>
                    <div className="corner bottom-right"></div>
                  </div>
                </div>
                
                <div className="scanner-instructions">
                  <IonText color="light">
                    <h3>Position QR code within the frame</h3>
                  </IonText>
                </div>
                
                <IonButton
                  fill="clear"
                  color="light"
                  onClick={handleStopScan}
                  className="stop-scan-button"
                >
                  <IonIcon icon={closeOutline} />
                  Cancel
                </IonButton>
              </div>
            </div>
          )}

          {scannedCode && isLoadingTable && (
            <LoadingSpinner message="Verifying table..." />
          )}
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color="danger"
        />

        <IonAlert
          isOpen={showConfirmAlert}
          onDidDismiss={() => {
            setShowConfirmAlert(false);
            setScannedCode(null);
          }}
          header="Start Session"
          subHeader={scannedTable ? `Table ${scannedTable.tableNumber}` : ''}
          message={
            scannedTable
              ? `Location: ${scannedTable.location}<br/>Rate: ${scannedTable.hourlyRate} credits/hour<br/>Capacity: ${scannedTable.capacity} person(s)`
              : 'Invalid QR code'
          }
          buttons={
            scannedTable
              ? [
                  {
                    text: 'Cancel',
                    role: 'cancel',
                  },
                  {
                    text: 'Start Session',
                    handler: handleStartSession,
                  },
                ]
              : [
                  {
                    text: 'OK',
                    role: 'cancel',
                  },
                ]
          }
        />
      </IonContent>
    </IonPage>
  );
};

export default TableScanner;