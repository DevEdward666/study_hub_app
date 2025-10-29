import React from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol,
  RefresherEventDetail,
  useIonViewDidEnter,
} from "@ionic/react";
import {
  qrCodeOutline,
  cardOutline,
  businessOutline,
  timeOutline,
  trendingUpOutline,
  statsChartOutline,
  bookOutline,
  personCircleOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useAuth } from "../../hooks/AuthHooks";
import { useTables } from "../../hooks/TableHooks";
import { useUser } from "../../hooks/UserHooks";
import { usePremise } from "../../hooks/PremiseHooks";
import { useNotifications } from "../../hooks/useNotifications";
import { useConfirmation } from "../../hooks/useConfirmation";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ConfirmToast } from "../../components/common/ConfirmToast";
import "./Dashboard.css";
import { is } from "zod/v4/locales";

const Dashboard: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const { activeSession, endSession, isLoadingActiveSession } = useTables();
  const { credits, sessions, isLoadingCredits, refetchCredits } = useUser();
  const { access, isLoadingAccess, refetchAccess } = usePremise();
  
  // Notifications hook
  const {
    notifySessionEnd,
    isSupported: isPushSupported,
    permission: pushPermission,
    requestPermission: requestPushPermission
  } = useNotifications();

  // Confirmation toast hook
  const {
    isOpen: isConfirmOpen,
    options: confirmOptions,
    showConfirmation,
    handleConfirm: confirmAction,
    handleCancel: cancelAction,
    handleDismiss: dismissConfirm
  } = useConfirmation();
  useIonViewDidEnter(()=>{
  if( pushPermission !== "granted"){
      requestPushPermission();
    }
  })
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await Promise.all([refetchCredits(), refetchAccess()]);
    event.detail.complete();
  };

  const handleEndSession = async () => {
    if (activeSession) {
      const durationMinutes = Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / (1000 * 60));
      
      // Show confirmation toast
      showConfirmation({
        header: 'End Study Session',
        message: `Are you sure you want to end your study session at Table ${activeSession.table.tableNumber}?\n\nDuration: ${durationMinutes} minutes\nCredits used: ${activeSession.amount || 0}\n\nThis action cannot be undone.`,
        confirmText: 'End Session',
        cancelText: 'Continue Studying'
      }, async () => {
        await performEndSession();
      });
    }
  };

  const performEndSession = async () => {
    if (!activeSession) return;

    try {
      // Calculate session duration
      const startTime = new Date(activeSession.startTime).getTime();
      const endTime = Date.now();
      const durationMinutes = Math.floor((endTime - startTime) / (1000 * 60));
        
      await endSession.mutateAsync(activeSession.id);
      
      // Send push notification when session ends
      if (isPushSupported && pushPermission === "granted") {
        try {
          await notifySessionEnd(
            activeSession.id,
            activeSession.table.tableNumber,
            durationMinutes,
            activeSession.amount || 0
          );
        } catch (notifError) {
          console.error("Failed to send notification:", notifError);
        }
      }
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getActivityStats = () => {
    const totalSessions = sessions?.length || 0;
    const completedSessions =
      sessions?.filter((s) => s.status === "Completed").length || 0;
    const totalHours =
      sessions?.reduce((sum, s) => {
        if (s.endTime && s.startTime) {
          const duration =
            new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
          return sum + duration / (1000 * 60 * 60);
        }
        return sum;
      }, 0) || 0;

    return {
      totalSessions,
      completedSessions,
      totalHours: Math.round(totalHours * 10) / 10,
      totalSpent: credits?.totalSpent || 0,
    };
  };

  const stats = getActivityStats();

  // if (isLoadingActiveSession || isLoadingCredits || isLoadingAccess) {
  //   return (
  //     <IonPage>
  //       <IonHeader>
  //         <IonToolbar>
  //           <IonTitle>Dashboard</IonTitle>
  //         </IonToolbar>
  //       </IonHeader>
  //       <IonContent>
  //         <LoadingSpinner message="Loading dashboard..." />
  //       </IonContent>
  //     </IonPage>
  //   );
  // }

  return (
    <IonPage>
      <IonContent fullscreen className="dashboard-content">
        <IonHeader className="dashboard-header">
          <IonToolbar>
            <IonTitle>Dashboard</IonTitle>
            <IonButton
              slot="end"
              fill="clear"
              onClick={() => history.push("/app/profile")}
              className="profile-button"
            >
              <IonIcon icon={personCircleOutline} />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="dashboard-container">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-content">
              <div className="greeting-section">
                <h1 className="greeting-text">{getGreeting()}</h1>
                <h2 className="user-name">{user?.name || "Student"}</h2>
                <p className="welcome-subtitle">
                  Ready to start your productive study session?
                </p>
              </div>

              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="stat-number">{credits?.balance || 0}</div>
                  <div className="stat-label">Credits Available</div>
                </div>
                <div className="stat-divider"></div>
                <div className="hero-stat">
                  <div className="stat-number">{stats.totalHours}h</div>
                  <div className="stat-label">Study Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Session Card - Ultra Compact */}
          {activeSession && (
            <div className="active-session-banner">
              <div className="session-banner-content">
                <div className="session-info-compact">
                  <div className="session-status-mini">
                    <div className="status-dot-mini"></div>
                    <span className="session-text">Table {activeSession.table.tableNumber}</span>
                  </div>
                  <div className="session-metrics-mini">
                    <span className="metric-mini">
                      {Math.floor(
                        (Date.now() - new Date(activeSession.startTime).getTime()) / (1000 * 60)
                      )}m
                    </span>
                    <span className="metric-separator">•</span>
                    <span className="metric-mini">{activeSession.amount} credits</span>
                  </div>
                </div>
                <IonButton
                  fill="clear"
                  color="danger"
                  size="small"
                  onClick={handleEndSession}
                  disabled={endSession.isPending}
                  className="end-session-mini"
                >
                  {endSession.isPending ? "Ending..." : "End"}
                </IonButton>
              </div>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="stats-section">
            <h3 className="section-title">Your Study Analytics</h3>

            <IonGrid className="stats-grid">
              <IonRow>
                <IonCol size="6">
                  <div className="modern-stat-card credits-card">
                    <div className="stat-card-header">
                      <div className="stat-icon-container credits-icon">
                        <IonIcon icon={cardOutline} />
                      </div>
                      <div className="stat-trend">
                        <IonIcon icon={trendingUpOutline} />
                        <span>+12%</span>
                      </div>
                    </div>
                    <div className="stat-card-content">
                      <div className="stat-main-value">{credits?.balance || 0}</div>
                      <div className="stat-title">Available Credits</div>
                      <div className="stat-subtitle">
                        <span className="stat-highlight">{stats.totalSpent}</span> spent this month
                        <span className="stat-change-text">
                          {stats.totalSpent > 0 && ` • ${Math.round((stats.totalSpent / (credits?.balance || 1)) * 100)}% usage rate`}
                        </span>
                      </div>
                    </div>
                  </div>
                </IonCol>

                <IonCol size="6">
                  <div className="modern-stat-card premise-card">
                    <div className="stat-card-header">
                      <div className="stat-icon-container premise-icon">
                        <IonIcon icon={businessOutline} />
                      </div>
                      <div className={`status-badge ${access ? 'active' : 'inactive'}`}>
                        {access ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="stat-card-content">
                      {access ? (
                        <>
                          <div className="stat-main-value access-active">
                            {formatTimeRemaining(access.timeRemaining).split(' ')[0]}
                            <span className="stat-unit">h</span>
                          </div>
                          <div className="stat-title">Time Remaining</div>
                          <div className="stat-subtitle">Premise access active</div>
                        </>
                      ) : (
                        <>
                          <div className="stat-main-value access-inactive">--</div>
                          <div className="stat-title">Premise Access</div>
                          <div className="stat-subtitle">Scan QR to activate</div>
                        </>
                      )}
                    </div>
                  </div>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="6">
                  <div className="modern-stat-card sessions-card">
                    <div className="stat-card-header">
                      <div className="stat-icon-container sessions-icon">
                        <IonIcon icon={bookOutline} />
                      </div>
                      <div className="stat-change positive">
                        <IonIcon icon={trendingUpOutline} />
                        <span>+5</span>
                      </div>
                    </div>
                    <div className="stat-card-content">
                      <div className="stat-main-value">{stats.completedSessions}</div>
                      <div className="stat-title">Study Sessions</div>
                      <div className="stat-subtitle">
                        <span className="stat-highlight">{stats.totalSessions}</span> total sessions
                      </div>
                    </div>
                  </div>
                </IonCol>

                <IonCol size="6">
                  <div className="modern-stat-card performance-card">
                    <div className="stat-card-header">
                      <div className="stat-icon-container performance-icon">
                        <IonIcon icon={statsChartOutline} />
                      </div>
                    </div>
                    <div className="stat-card-content">
                      <div className="stat-main-value">
                        {stats.totalHours}
                        <span className="stat-unit">h</span>
                      </div>
                      <div className="stat-title">Study Hours</div>
                      <div className="stat-subtitle">
                        Avg <span className="stat-highlight">{stats.completedSessions > 0 ? (stats.totalHours / stats.completedSessions).toFixed(1) : 0}h</span> per session
                      </div>
                    </div>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </div>
          {/* Quick Actions */}
          {/* <div className="actions-section">
            <h3 className="section-title">Quick Actions</h3>

            <div className="action-cards">
              <IonCard
                className="action-card primary-action"
                button
                onClick={() => history.push("/app/scanner")}
              >
                <IonCardContent>
                  <div className="action-content">
                    <div className="action-icon-wrapper">
                      <IonIcon icon={qrCodeOutline} className="action-icon" />
                    </div>
                    <div className="action-text">
                      <h4>Scan Table QR</h4>
                      <p>Start your study session</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>

              <IonCard
                className="action-card secondary-action"
                button
                onClick={() => history.push("/app/credits")}
              >
                <IonCardContent>
                  <div className="action-content">
                    <div className="action-icon-wrapper">
                      <IonIcon icon={cardOutline} className="action-icon" />
                    </div>
                    <div className="action-text">
                      <h4>Manage Credits</h4>
                      <p>Purchase more credits</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>

              <IonCard
                className="action-card tertiary-action"
                button
                onClick={() => history.push("/app/premise")}
              >
                <IonCardContent>
                  <div className="action-content">
                    <div className="action-icon-wrapper">
                      <IonIcon icon={businessOutline} className="action-icon" />
                    </div>
                    <div className="action-text">
                      <h4>Premise Access</h4>
                      <p>Activate building entry</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>

              <IonCard
                className="action-card quaternary-action"
                button
                onClick={() => history.push("/app/history")}
              >
                <IonCardContent>
                  <div className="action-content">
                    <div className="action-icon-wrapper">
                      <IonIcon
                        icon={statsChartOutline}
                        className="action-icon"
                      />
                    </div>
                    <div className="action-text">
                      <h4>View Analytics</h4>
                      <p>Check your progress</p>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          </div> */}
        </div>
      </IonContent>

      <ConfirmToast
        isOpen={isConfirmOpen}
        onDidDismiss={dismissConfirm}
        onConfirm={confirmAction}
        onCancel={cancelAction}
        message={confirmOptions.message}
        header={confirmOptions.header}
        confirmText={confirmOptions.confirmText}
        cancelText={confirmOptions.cancelText}
      />
    </IonPage>
  );
};

export default Dashboard;
