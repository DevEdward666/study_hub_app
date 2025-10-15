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
} from "@ionic/react";
import {
  qrCodeOutline,
  cardOutline,
  businessOutline,
  timeOutline,
  stopOutline,
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
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const { activeSession, endSession, isLoadingActiveSession } = useTables();
  const { credits, sessions, isLoadingCredits, refetchCredits } = useUser();
  const { access, isLoadingAccess, refetchAccess } = usePremise();

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await Promise.all([refetchCredits(), refetchAccess()]);
    event.detail.complete();
  };

  const handleEndSession = async () => {
    if (activeSession) {
      try {
        await endSession.mutateAsync(activeSession.id);
      } catch (error) {
        console.error("Error ending session:", error);
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

          {/* Active Session Card */}
          {activeSession && (
            <IonCard className="session-card modern-card">
              <div className="session-card-header">
                <div className="session-info">
                  <div className="session-title">
                    <IonIcon icon={timeOutline} className="session-icon" />
                    <span>Active Study Session</span>
                  </div>
                  <IonBadge color="success" className="session-badge">
                    In Progress
                  </IonBadge>
                </div>
                <div className="session-table">
                  <h3>Table {activeSession.table.tableNumber}</h3>
                  <p>{activeSession.table.location}</p>
                </div>
              </div>

              <IonCardContent>
                <div className="session-details">
                  <div className="session-metrics">
                    <div className="metric">
                      <IonIcon icon={timeOutline} />
                      <div>
                        <span className="metric-value">
                          {Math.floor(
                            (Date.now() -
                              new Date(activeSession.startTime).getTime()) /
                              (1000 * 60)
                          )}
                          m
                        </span>
                        <span className="metric-label">Duration</span>
                      </div>
                    </div>

                    <div className="metric">
                      <IonIcon icon={cardOutline} />
                      <div>
                        <span className="metric-value">
                          {activeSession.creditsUsed}
                        </span>
                        <span className="metric-label">Credits Used</span>
                      </div>
                    </div>
                  </div>

                  <IonButton
                    expand="block"
                    fill="outline"
                    color="danger"
                    onClick={handleEndSession}
                    disabled={endSession.isPending}
                    className="end-session-btn"
                  >
                    <IonIcon icon={stopOutline} slot="start" />
                    {endSession.isPending ? "Ending..." : "End Session"}
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Quick Stats Grid */}
          <div className="stats-section">
            <h3 className="section-title">Your Study Analytics</h3>

            <IonGrid className="stats-grid">
              <IonRow>
                <IonCol size="6">
                  <div className="stat-card credits-stat">
                    <div className="stat-card-header">
                      <IonIcon icon={cardOutline} />
                    </div>
                    <div className="stat-card-content">
                      <div className="stat-value">{credits?.balance || 0}</div>
                      <div className="stat-title">Available Credits</div>
                      <div className="stat-subtitle">
                        {credits?.totalPurchased || 0} purchased total
                      </div>
                    </div>
                  </div>
                </IonCol>

                <IonCol size="6">
                  <div className="stat-card premise-stat">
                    <div className="stat-card-header">
                      <IonIcon icon={businessOutline} />
                    </div>
                    <div className="stat-card-content">
                      {access ? (
                        <>
                          <div className="stat-value access-active">Active</div>
                          <div className="stat-title">Premise Access</div>
                          <div className="stat-subtitle">
                            {formatTimeRemaining(access.timeRemaining)} left
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="stat-value access-inactive">
                            Inactive
                          </div>
                          <div className="stat-title">Premise Access</div>
                          <div className="stat-subtitle">Scan to activate</div>
                        </>
                      )}
                    </div>
                  </div>
                </IonCol>
              </IonRow>

              <IonRow>
                <IonCol size="6">
                  <div className="stat-card sessions-stat">
                    <div className="stat-card-header">
                      <IonIcon icon={bookOutline} />
                    </div>
                    <div className="stat-card-content">
                      <div className="stat-value">
                        {stats.completedSessions}
                      </div>
                      <div className="stat-title">Sessions</div>
                      <div className="stat-subtitle">Completed this month</div>
                    </div>
                  </div>
                </IonCol>

                <IonCol size="6">
                  <div className="stat-card performance-stat">
                    <div className="stat-card-header">
                      <IonIcon icon={trendingUpOutline} />
                    </div>
                    <div className="stat-card-content">
                      <div className="stat-value">{stats.totalHours}h</div>
                      <div className="stat-title">Study Hours</div>
                      <div className="stat-subtitle">Total time logged</div>
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
    </IonPage>
  );
};

export default Dashboard;
