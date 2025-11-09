import React, { useState } from "react";
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
  IonToast,
  IonIcon,
  IonText,
  IonList,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBadge,
  IonSelect,
  IonSelectOption,
  IonProgressBar,
  IonSearchbar,
  IonChip,
} from "@ionic/react";
import {
  closeOutline,
  personOutline,
  timeOutline,
  playOutline,
  pauseOutline,
  stopOutline,
  desktopOutline,
  checkmarkCircleOutline,
} from "ionicons/icons";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { SubscriptionTimer } from "../components/common/SubscriptionTimer";
import {
  useAllUserSubscriptions,
  useSubscriptionPackages,
} from "../hooks/SubscriptionHooks";
import { useTablesManagement } from "../hooks/AdminDataHooks";
import { tableService } from "../services/table.service";
import "../Admin/styles/admin.css";
import "../styles/side-modal.css";

interface SessionAction {
  userId: string;
  subscriptionId: string;
  tableId: string;
}

const UserSessionManagement: React.FC = () => {
  const { data: subscriptions, isLoading: loadingSubs, refetch: refetchSubs } = useAllUserSubscriptions();
  const { tables, isLoading: loadingTables, refetch: refetchTables } = useTablesManagement();
  const { data: packages } = useSubscriptionPackages(true);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Get active subscriptions with remaining hours
  const activeSubscriptions = subscriptions?.filter(s =>
    s.status === "Active" && s.remainingHours > 0
  ) || [];

  // Get available tables (no current session or session is not active)
  const availableTables = tables?.filter(t =>
    !t.currentSession ||
    (t.currentSession && !(t.currentSession as any).id)
  ) || [];

  // Get users currently using tables - check currentSession (not tableSessions)
  const activeSessions = tables?.filter(t =>
    t.currentSession && (t.currentSession as any).id
  ).map(t => ({
    table: t,
    session: t.currentSession
  })) || [];

  // Filter subscriptions
  const filteredSubscriptions = activeSubscriptions.filter(sub => {
    const matchesSearch = !searchText ||
      sub.user?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      sub.user?.email?.toLowerCase().includes(searchText.toLowerCase());

    const isInSession = activeSessions.some(as => as.session?.userId === sub.userId);

    if (filterStatus === "available") return matchesSearch && !isInSession;
    if (filterStatus === "in-session") return matchesSearch && isInSession;
    return matchesSearch;
  });

  const handleAssignTable = (subscription: any) => {
    if (availableTables.length === 0) {
      setToastMessage("❌ No tables available");
      setToastColor("warning");
      setShowToast(true);
      return;
    }
    setSelectedSubscription(subscription);
    setSelectedTableId("");
    setShowAssignModal(true);
  };

  const handleStartSession = async () => {
    if (!selectedTableId || !selectedSubscription) {
      setToastMessage("❌ Please select a table");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    try {
      console.log('🔍 Starting session for subscription:', selectedSubscription);
      console.log('🔍 Current remaining hours:', selectedSubscription.remainingHours);

      // Call backend API to start subscription session
      const sessionId = await tableService.startSubscriptionSession(
        selectedTableId,
        selectedSubscription.id,
        selectedSubscription.userId
      );

      console.log('🔍 Session started with ID:', sessionId);

      setToastMessage(`✅ Session started for ${selectedSubscription.user?.name || 'User'}!`);
      setToastColor("success");
      setShowToast(true);
      setShowAssignModal(false);

      // Refresh data
      console.log('🔍 Refetching data after start...');
      await refetchSubs();
      await refetchTables();

      console.log('🔍 After refetch - Subscription hours:', subscriptions?.find(s => s.id === selectedSubscription.id)?.remainingHours);
    } catch (error: any) {
      console.error("Failed to start session:", error);
      setToastMessage(`❌ Failed to start session: ${error.message || 'Unknown error'}`);
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const handlePauseSession = async (session: any, table: any) => {
    try {
      console.log('🔍 Before pause - Session:', session);
      console.log('🔍 Before pause - User subscription hours:', subscriptions?.find(s => s.id === session.subscriptionId)?.remainingHours);

      // Call backend API to end/pause session
      const result = await tableService.endSession(session.id);
      console.log('🔍 Backend response:', result);

      setToastMessage(`⏸️ Session paused! Hours saved for ${session.user?.name || 'User'}`);
      setToastColor("success");
      setShowToast(true);

      // Refresh data
      console.log('🔍 Refetching subscriptions...');
      await refetchSubs();
      console.log('🔍 After refetch - All subscriptions:', subscriptions);

      await refetchTables();

      console.log('🔍 After pause - User subscription hours:', subscriptions?.find(s => s.id === session.subscriptionId)?.remainingHours);
    } catch (error: any) {
      console.error("Failed to pause session:", error);
      setToastMessage(`❌ Failed to pause session: ${error.message || 'Unknown error'}`);
      setToastColor("danger");
      setShowToast(true);
    }
  };

  if (loadingSubs || loadingTables) {
    return (
      <IonContent style={{ height: '100vh', background: '#f5f5f5' }}>
        <div style={{ padding: '20px', minHeight: '100%' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ color: 'var(--ion-color-primary)', margin: '0 0 4px 0', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IonIcon icon={desktopOutline} />
              User & Session Management
            </h2>
            <p style={{ color: 'black', margin: '0', fontSize: '16px' }}>Assign tables to users, pause/resume sessions, track hours</p>
          </div>
          <LoadingSpinner message="Loading users and sessions..." />
        </div>
      </IonContent>
    );
  }

  return (
    <IonContent>
      <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ color: "var(--ion-color-primary)", display: "flex", alignItems: "center", gap: "12px" }}>
            <IonIcon icon={desktopOutline} />
            User & Session Management
          </h2>
          <p style={{ color: "#666", marginTop: "8px" }}>
            Assign tables to users, pause/resume sessions, track hours
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          <IonCard>
            <IonCardContent style={{ textAlign: "center", padding: "16px" }}>
              <IonIcon icon={personOutline} style={{ fontSize: "32px", color: "var(--ion-color-primary)" }} />
              <h3 style={{ margin: "8px 0 4px", fontSize: "24px", fontWeight: "bold" }}>
                {activeSubscriptions.length}
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Active Users</p>
            </IonCardContent>
          </IonCard>
          <IonCard>
            <IonCardContent style={{ textAlign: "center", padding: "16px" }}>
              <IonIcon icon={playOutline} style={{ fontSize: "32px", color: "var(--ion-color-success)" }} />
              <h3 style={{ margin: "8px 0 4px", fontSize: "24px", fontWeight: "bold" }}>
                {activeSessions.length}
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>In Session</p>
            </IonCardContent>
          </IonCard>
          <IonCard>
            <IonCardContent style={{ textAlign: "center", padding: "16px" }}>
              <IonIcon icon={desktopOutline} style={{ fontSize: "32px", color: "var(--ion-color-warning)" }} />
              <h3 style={{ margin: "8px 0 4px", fontSize: "24px", fontWeight: "bold" }}>
                {availableTables.length}
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Tables Available</p>
            </IonCardContent>
          </IonCard>
          <IonCard>
            <IonCardContent style={{ textAlign: "center", padding: "16px" }}>
              <IonIcon icon={timeOutline} style={{ fontSize: "32px", color: "var(--ion-color-tertiary)" }} />
              <h3 style={{ margin: "8px 0 4px", fontSize: "24px", fontWeight: "bold" }}>
                {activeSubscriptions.reduce((sum, s) => sum + s.remainingHours, 0).toFixed(0)}
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Total Hours Available</p>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Active Sessions Section */}
        {activeSessions.length > 0 && (
          <div style={{ marginBottom: "30px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "var(--ion-color-success)" }}>
              🟢 Active Sessions
            </h2>
            <IonList>
              {activeSessions.map(({ table, session }) => {
                // Get user info from subscription or session
                const sessionData = session as any;
                const userSubscription = subscriptions?.find(s => s.id === sessionData?.subscriptionId);
                const userName = userSubscription?.user?.name || sessionData?.customerName || 'User';

                return (
                  <IonCard key={sessionData?.id} style={{ marginBottom: "12px", border: "2px solid var(--ion-color-success)" }}>
                    <IonCardContent>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                        <div style={{ flex: 1, minWidth: "250px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
                              {userName}
                            </h3>
                          </div>
                          <div style={{ marginLeft: "8px" }}>
                            <p style={{ margin: "4px 0", fontSize: "14px" }}>
                              📍 <strong>Table {table?.tableNumber}</strong>
                            </p>
                            <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
                              💰 {sessionData?.subscription?.packageName || userSubscription?.packageName || 'Subscription'}
                            </p>
                            <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
                              🕐 Started: {sessionData?.startTime ? new Date(sessionData.startTime).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}>
                          {/* Real-time timer */}
                          {sessionData?.startTime && (
                            <SubscriptionTimer
                              startTime={sessionData.startTime}
                              remainingHours={userSubscription?.remainingHours}
                              compact={false}
                              showIcon={true}
                            />
                          )}
                          <IonButton
                            color="warning"
                            onClick={() => handlePauseSession(sessionData, table)}
                          >
                            <IonIcon icon={pauseOutline} slot="start" />
                            Pause & Save
                          </IonButton>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                );
              })}
            </IonList>
          </div>
        )}

        {/* Filters */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value || "")}
            placeholder="Search by name or email..."
            style={{ flex: 1, minWidth: "250px" }}
          />
          <IonSelect
            value={filterStatus}
            onIonChange={(e) => setFilterStatus(e.detail.value)}
            placeholder="Filter"
            style={{ minWidth: "150px" }}
          >
            <IonSelectOption value="all">All Users</IonSelectOption>
            <IonSelectOption value="available">Available to Assign</IonSelectOption>
            <IonSelectOption value="in-session">Currently In Session</IonSelectOption>
          </IonSelect>
        </div>

        {/* Available Users Section */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>
            Users with Active Hours
          </h2>
          {filteredSubscriptions.length === 0 ? (
            <IonCard>
              <IonCardContent style={{ textAlign: "center", padding: "40px" }}>
                <IonIcon icon={personOutline} style={{ fontSize: "64px", color: "#ccc", marginBottom: "16px" }} />
                <IonText color="medium">
                  <p>No users found with active subscriptions.</p>
                </IonText>
              </IonCardContent>
            </IonCard>
          ) : (
            <IonList>
              {filteredSubscriptions.map((sub) => {
                // Check if user is currently in session by matching userId or subscriptionId
                const isInSession = activeSessions.some(as => {
                  const sessionData = as.session as any;
                  return sessionData?.subscriptionId === sub.id ||
                    sessionData?.userId === sub.userId;
                });

                return (
                  <IonCard key={sub.id} style={{ marginBottom: "12px" }}>
                    <IonCardContent>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                        <div style={{ flex: 1, minWidth: "250px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <IonIcon icon={personOutline} style={{ fontSize: "24px", color: "var(--ion-color-primary)" }} />
                            <div>
                              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
                                {sub.user?.name || sub.user?.email}
                              </h3>
                              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#666" }}>
                                {sub.user?.email}
                              </p>
                            </div>
                            {isInSession && (
                              <IonBadge color="success">In Session</IonBadge>
                            )}
                          </div>
                          <div style={{ marginLeft: "32px" }}>
                            <p style={{ margin: "4px 0", fontSize: "14px", fontWeight: "600", color: "var(--ion-color-primary)" }}>
                              📦 {sub.packageName}
                            </p>
                            <div style={{ marginTop: "8px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                                <span>Remaining:</span>
                                <span>
                                  <strong>
                                    {(() => {
                                      const totalSeconds = Math.floor(sub.remainingHours * 3600);
                                      const hours = Math.floor(totalSeconds / 3600);
                                      const minutes = Math.floor((totalSeconds % 3600) / 60);
                                      const seconds = totalSeconds % 60;
                                      return `${hours}h ${minutes}m ${seconds}s`;
                                    })()}
                                  </strong>
                                </span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px", color: "#666" }}>
                                <span>Total:</span>
                                <span>{sub.totalHours.toFixed(0)}h</span>
                              </div>
                              <IonProgressBar
                                value={sub.remainingHours / sub.totalHours}
                                color={sub.percentageUsed > 80 ? "danger" : "success"}
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          {!isInSession && (
                            <IonButton
                              color="primary"
                              onClick={() => handleAssignTable(sub)}
                              disabled={availableTables.length === 0}
                            >
                              <IonIcon icon={playOutline} slot="start" />
                              Assign Table
                            </IonButton>
                          )}
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                );
              })}
            </IonList>
          )}
        </div>

        {/* Assign Table Modal */}
        <IonModal
          isOpen={showAssignModal}
          onDidDismiss={() => setShowAssignModal(false)}
          breakpoints={[0, 1]}
          initialBreakpoint={1}
          handle={false}
          className="side-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Assign Table</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowAssignModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedSubscription && (
              <>
                <div style={{ marginBottom: "24px", padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
                  <h3 style={{ margin: "0 0 8px 0" }}>{selectedSubscription.user?.name || selectedSubscription.user?.email}</h3>
                  <p style={{ margin: "4px 0", fontSize: "14px" }}>
                    📦 {selectedSubscription.packageName}
                  </p>
                  <p style={{ margin: "4px 0", fontSize: "14px", fontWeight: "bold", color: "var(--ion-color-success)" }}>
                    ⏱️ {selectedSubscription.remainingHours.toFixed(1)} hours remaining
                  </p>
                </div>

                <IonItem>
                  <IonLabel position="stacked">Select Table *</IonLabel>
                  <IonSelect
                    value={selectedTableId}
                    onIonChange={(e) => setSelectedTableId(e.detail.value)}
                    placeholder="Choose a table"
                  >
                    {availableTables.map((table: any) => (
                      <IonSelectOption key={table.id} value={table.id}>
                        Table {table.tableNumber} - {table.capacity} seats
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>

                {availableTables.length === 0 && (
                  <IonText color="warning">
                    <p style={{ fontSize: "14px", marginTop: "12px" }}>
                      ⚠️ No tables available. Please wait for a table to become free.
                    </p>
                  </IonText>
                )}

                <div style={{ marginTop: "24px" }}>
                  <IonButton
                    expand="block"
                    onClick={handleStartSession}
                    disabled={!selectedTableId || availableTables.length === 0}
                  >
                    <IonIcon icon={playOutline} slot="start" />
                    Start Session
                  </IonButton>
                </div>
              </>
            )}
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={3000}
          onDidDismiss={() => setShowToast(false)}
          color={toastColor}
        />
      </div>
    </IonContent>
  );
};

export default UserSessionManagement;

