import React from 'react';
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
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol,
  RefresherEventDetail,
} from '@ionic/react';
import {
  qrCodeOutline,
  cardOutline,
  businessOutline,
  timeOutline,
  stopOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../hooks/AuthHooks';
import { useTables } from '../../hooks/TableHooks';
import { useUser } from '../../hooks/UserHooks';
import { usePremise } from '../../hooks/PremiseHooks';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const { activeSession, endSession, isLoadingActiveSession } = useTables();
  const { credits, isLoadingCredits, refetchCredits } = useUser();
  const { access, isLoadingAccess, refetchAccess } = usePremise();

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await Promise.all([
      refetchCredits(),
      refetchAccess(),
    ]);
    event.detail.complete();
  };

  const handleEndSession = async () => {
    if (activeSession) {
      try {
        await endSession.mutateAsync(activeSession.id);
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoadingActiveSession || isLoadingCredits || isLoadingAccess) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <LoadingSpinner message="Loading dashboard..." />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen className="dashboard-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="dashboard-container">
          {/* Welcome Section */}
          <div className="welcome-section">
            <h1>{getGreeting()}, {user?.name || 'User'}!</h1>
            <p>Welcome to your StudyHub dashboard</p>
          </div>

          {/* Active Session Card */}
          {activeSession && (
            <IonCard className="session-card active-session">
              <IonCardHeader>
                <IonCardTitle className="session-card-title">
                  <IonIcon icon={timeOutline} />
                  Active Session
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="session-details">
                  <div className="session-info">
                    <h3>Table {activeSession.table.tableNumber}</h3>
                    <p>{activeSession.table.location}</p>
                    <div className="session-stats">
                      <span>Started: {new Date(activeSession.startTime).toLocaleTimeString()}</span>
                      <span>Credits used: {activeSession.creditsUsed}</span>
                    </div>
                  </div>
                  <IonButton
                    fill="clear"
                    color="danger"
                    onClick={handleEndSession}
                    disabled={endSession.isPending}
                  >
                    <IonIcon icon={stopOutline} slot="start" />
                    End Session
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Quick Stats Grid */}
          <IonGrid className="stats-grid">
            <IonRow>
              <IonCol size="6">
                <IonCard className="stat-card credits-card" button onClick={() => history.push('/app/credits')}>
                  <IonCardContent>
                    <div className="stat-content">
                      <IonIcon icon={cardOutline} className="stat-icon" />
                      <div className="stat-info">
                        <h3>{credits?.balance || 0}</h3>
                        <p>Credits</p>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              
              <IonCol size="6">
                <IonCard className="stat-card premise-card" button onClick={() => history.push('/app/premise')}>
                  <IonCardContent>
                    <div className="stat-content">
                      <IonIcon icon={businessOutline} className="stat-icon" />
                      <div className="stat-info">
                        {access ? (
                          <>
                            <IonBadge color="success">Active</IonBadge>
                            <p>{formatTimeRemaining(access.timeRemaining)}</p>
                          </>
                        ) : (
                          <>
                            <IonBadge color="medium">Inactive</IonBadge>
                            <p>Premise Access</p>
                          </>
                        )}
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            
            <IonCard className="action-card" button onClick={() => history.push('/app/scanner')}>
              <IonCardContent>
                <div className="action-content">
                  <IonIcon icon={qrCodeOutline} className="action-icon" />
                  <div className="action-info">
                    <h3>Scan Table QR</h3>
                    <p>Start a new study session</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="action-card" button onClick={() => history.push('/app/history')}>
              <IonCardContent>
                <div className="action-content">
                  <IonIcon icon={timeOutline} className="action-icon" />
                  <div className="action-info">
                    <h3>View History</h3>
                    <p>See your past sessions</p>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
