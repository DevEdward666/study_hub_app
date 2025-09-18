import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonBackButton,
  IonButtons,
  IonBadge,
  IonItem,
  IonLabel,
  IonToast,
  IonAlert,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import {
  locationOutline,
  peopleOutline,
  cardOutline,
  timeOutline,
  playOutline,
  stopOutline,
  qrCodeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { useTables } from '../../hooks/TableHooks';
import { useUser } from '../../hooks/UserHooks';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import './TableDetails.css';

interface TableParams {
  id: string;
}

const TableDetails: React.FC = () => {
  const { id } = useParams<TableParams>();
  const history = useHistory();
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');
  const [showEndSessionAlert, setShowEndSessionAlert] = useState(false);

  const { 
    tables, 
    activeSession, 
    startSession, 
    endSession, 
    refetchTables,
    refetchActiveSession 
  } = useTables();
  
  const { credits, refetchCredits } = useUser();

  // Find the table by ID
  const table = tables.find(t => t.id === id);
  const isCurrentTable = activeSession?.table.id === id;
  const hasInsufficientCredits = (credits?.balance || 0) < (table?.hourlyRate || 0);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await Promise.all([
      refetchTables(),
      refetchActiveSession(),
      refetchCredits(),
    ]);
    event.detail.complete();
  };

  const handleStartSession = async () => {
    if (!table) return;

    if (hasInsufficientCredits) {
      setToastMessage(`Insufficient credits. You need ${table.hourlyRate} credits to start a session.`);
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    if (table.isOccupied && !isCurrentTable) {
      setToastMessage('This table is currently occupied by another user.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    try {
      await startSession.mutateAsync({
        tableId: table.id,
        qrCode: table.qrCode,
      });
      
      setToastMessage('Session started successfully!');
      setToastColor('success');
      setShowToast(true);
      
      // Navigate back to dashboard
      setTimeout(() => {
        history.push('/app/dashboard');
      }, 1000);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start session';
      setToastMessage(message);
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      await endSession.mutateAsync(activeSession.id);
      
      setToastMessage('Session ended successfully!');
      setToastColor('success');
      setShowToast(true);
      setShowEndSessionAlert(false);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to end session';
      setToastMessage(message);
      setToastColor('danger');
      setShowToast(true);
    }
  };

  const getSessionDuration = (): string => {
    if (!activeSession) return '';
    
    const now = new Date().getTime();
    const start = new Date(activeSession.startTime).getTime();
    const durationMs = now - start;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const estimatedCost = Math.ceil((new Date().getTime() - new Date(activeSession?.startTime || 0).getTime()) / (1000 * 60 * 60)) * (table?.hourlyRate || 0);

  if (!table) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/app/dashboard" />
            </IonButtons>
            <IonTitle>Table Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <ErrorMessage 
            message="Table not found" 
            onRetry={() => history.goBack()}
          />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/dashboard" />
          </IonButtons>
          <IonTitle>Table {table.tableNumber}</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen className="table-details-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="table-details-container">
          {/* Table Info Card */}
          <IonCard className="table-info-card">
            <IonCardHeader>
              <IonCardTitle className="table-title">
                <div className="title-content">
                  <h1>Table {table.tableNumber}</h1>
                  <IonBadge 
                    color={table.isOccupied ? (isCurrentTable ? 'success' : 'danger') : 'medium'} 
                    className="status-badge"
                  >
                    {table.isOccupied 
                      ? (isCurrentTable ? 'Your Session' : 'Occupied') 
                      : 'Available'
                    }
                  </IonBadge>
                </div>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="table-specs">
                <IonItem className="spec-item">
                  <IonIcon icon={locationOutline} slot="start" />
                  <IonLabel>
                    <h3>Location</h3>
                    <p>{table.location}</p>
                  </IonLabel>
                </IonItem>
                
                <IonItem className="spec-item">
                  <IonIcon icon={peopleOutline} slot="start" />
                  <IonLabel>
                    <h3>Capacity</h3>
                    <p>{table.capacity} {table.capacity === 1 ? 'person' : 'people'}</p>
                  </IonLabel>
                </IonItem>
                
                <IonItem className="spec-item">
                  <IonIcon icon={cardOutline} slot="start" />
                  <IonLabel>
                    <h3>Hourly Rate</h3>
                    <p>{table.hourlyRate} credits/hour</p>
                  </IonLabel>
                </IonItem>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Active Session Card */}
          {isCurrentTable && activeSession && (
            <IonCard className="session-card active">
              <IonCardHeader>
                <IonCardTitle className="session-title">
                  <IonIcon icon={playOutline} />
                  Active Session
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="session-details">
                  <div className="session-stats">
                    <div className="stat">
                      <IonIcon icon={timeOutline} />
                      <div className="stat-content">
                        <span className="stat-label">Duration</span>
                        <span className="stat-value">{getSessionDuration()}</span>
                      </div>
                    </div>
                    
                    <div className="stat">
                      <IonIcon icon={cardOutline} />
                      <div className="stat-content">
                        <span className="stat-label">Est. Cost</span>
                        <span className="stat-value">{estimatedCost} credits</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="session-info">
                    <p><strong>Started:</strong> {new Date(activeSession.startTime).toLocaleString()}</p>
                    <p><strong>Current Usage:</strong> {activeSession.creditsUsed} credits</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Credit Balance Card */}
          <IonCard className="credits-card">
            <IonCardContent>
              <div className="credits-info">
                <div className="credits-balance">
                  <IonIcon icon={cardOutline} className="credits-icon" />
                  <div className="balance-content">
                    <span className="balance-label">Your Credits</span>
                    <span className="balance-value">{credits?.balance || 0}</span>
                  </div>
                </div>
                
                {hasInsufficientCredits && !isCurrentTable && (
                  <div className="insufficient-credits">
                    <IonIcon icon={closeCircleOutline} />
                    <span>Insufficient credits for this table</span>
                  </div>
                )}
              </div>
            </IonCardContent>
          </IonCard>

          {/* Actions */}
          <div className="table-actions">
            {isCurrentTable ? (
              <IonButton
                expand="block"
                color="danger"
                size="large"
                onClick={() => setShowEndSessionAlert(true)}
                disabled={endSession.isPending}
                className="action-button"
              >
                {endSession.isPending ? (
                  <>
                    <IonSpinner name="crescent" />
                    <span style={{ marginLeft: '8px' }}>Ending Session...</span>
                  </>
                ) : (
                  <>
                    <IonIcon icon={stopOutline} slot="start" />
                    End Session
                  </>
                )}
              </IonButton>
            ) : table.isOccupied ? (
              <IonButton
                expand="block"
                color="medium"
                size="large"
                disabled
                className="action-button"
              >
                <IonIcon icon={closeCircleOutline} slot="start" />
                Table Occupied
              </IonButton>
            ) : (
              <IonButton
                expand="block"
                color="success"
                size="large"
                onClick={handleStartSession}
                disabled={startSession.isPending || hasInsufficientCredits}
                className="action-button"
              >
                {startSession.isPending ? (
                  <>
                    <IonSpinner name="crescent" />
                    <span style={{ marginLeft: '8px' }}>Starting Session...</span>
                  </>
                ) : hasInsufficientCredits ? (
                  <>
                    <IonIcon icon={closeCircleOutline} slot="start" />
                    Insufficient Credits
                  </>
                ) : (
                  <>
                    <IonIcon icon={playOutline} slot="start" />
                    Start Session
                  </>
                )}
              </IonButton>
            )}

            {/* QR Code Button */}
            <IonButton
              expand="block"
              fill="outline"
              size="large"
              onClick={() => history.push('/app/scanner')}
              className="qr-button"
            >
              <IonIcon icon={qrCodeOutline} slot="start" />
              Scan QR Code Instead
            </IonButton>
          </div>

          {/* Usage Guidelines */}
          <IonCard className="guidelines-card">
            <IonCardContent>
              <h3>Table Usage Guidelines</h3>
              <div className="guidelines-list">
                <div className="guideline-item">
                  <IonIcon icon={checkmarkCircleOutline} color="success" />
                  <span>Keep your workspace clean and organized</span>
                </div>
                <div className="guideline-item">
                  <IonIcon icon={checkmarkCircleOutline} color="success" />
                  <span>Respect other users and maintain quiet study environment</span>
                </div>
                <div className="guideline-item">
                  <IonIcon icon={checkmarkCircleOutline} color="success" />
                  <span>End your session when leaving the table</span>
                </div>
                <div className="guideline-item">
                  <IonIcon icon={checkmarkCircleOutline} color="success" />
                  <span>Monitor your credit balance during long sessions</span>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        {/* End Session Confirmation Alert */}
        <IonAlert
          isOpen={showEndSessionAlert}
          onDidDismiss={() => setShowEndSessionAlert(false)}
          header="End Session"
          subHeader="Confirm session termination"
          message={`You will be charged ${estimatedCost} credits for this session. Do you want to end it now?`}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'End Session',
              role: 'destructive',
              handler: handleEndSession,
            },
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default TableDetails;