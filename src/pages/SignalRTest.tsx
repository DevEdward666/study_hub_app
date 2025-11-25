import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonList,
  IonText,
  IonChip,
} from "@ionic/react";
import {
  wifiOutline,
  checkmarkCircle,
  closeCircle,
  refreshCircle,
  notificationsOutline,
  timeOutline,
  warningOutline,
  sendOutline,
} from "ionicons/icons";
import { signalRService, SessionEndedNotification } from "../services/signalr.service";
import { apiClient } from "../services/api.client";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { ApiResponseSchema } from "@/schema/api.schema";

const SignalRTest: React.FC = () => {
  const [connectionState, setConnectionState] = useState<string>("Disconnected");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<SessionEndedNotification[]>([]);
  const [lastPing, setLastPing] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [success, setSuccess] = useState<string>("");
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [isInAdminsGroup, setIsInAdminsGroup] = useState<boolean>(false);

  // Add log helper
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setConsoleLogs((prev) => [logMessage, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  // Mutation to send test notification
  const sendTestMutation = useMutation({
    mutationFn: () =>
      apiClient.post("/admin/test-signalr", ApiResponseSchema(z.string()), {}),
    onSuccess: (response: any) => {
      const message = "Test notification triggered";
      setSuccess(message);
      setError("");
      addLog(`✅ ${message}`);
      addLog("⏳ Waiting for notification to arrive via SignalR...");
      setTimeout(() => setSuccess(""), 5000);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.message || "Failed to send test notification";
      setError(message);
      setSuccess("");
      addLog(`❌ ${message}`);
    },
  });

  useEffect(() => {
    addLog("🔍 SignalR Test Page - Starting connection monitoring");

    // Monitor connection state changes
    const checkConnectionState = () => {
      if (signalRService["connection"]) {
        const state = signalRService["connection"].state;
        const connectionId = signalRService["connection"].connectionId;

        if (state !== connectionState) {
          addLog(`📡 Connection state changed: ${connectionState} → ${state}`);
          addLog(`🆔 Connection ID: ${connectionId || "None"}`);
        }

        setConnectionState(state);
        setIsConnected(state === "Connected");
      } else {
        if (connectionState !== "Disconnected") {
          addLog("⚠️ SignalR connection object not initialized");
        }
      }
    };

    // Check state every second
    const interval = setInterval(checkConnectionState, 1000);

    // Setup notification listener
    addLog("🔔 Registering SessionEnded listener...");
    signalRService.onSessionEnded((notification: SessionEndedNotification) => {
      addLog(`📨 Received notification for Table ${notification.tableNumber}`);
      addLog(`🔊 Notification should trigger sound and modal`);
      setNotifications((prev) => [notification, ...prev]);
      setLastPing(new Date().toLocaleTimeString());
    });

    // Initial check
    checkConnectionState();

    return () => {
      addLog("🛑 SignalR Test Page - Cleanup");
      clearInterval(interval);
    };
  }, [connectionState]);

  const handleConnect = async () => {
    try {
      setError("");
      setSuccess("");
      addLog("🔌 Manual connect triggered...");
      addLog(`📍 Current state: ${signalRService["connection"]?.state || "No connection"}`);
      
      await signalRService.start();
      
      addLog("✅ Connection successful");
      addLog(`🆔 Connection ID: ${signalRService["connection"]?.connectionId || "Unknown"}`);
      
      // Manually invoke JoinAdmins to ensure we're in the group
      try {
        addLog("🔐 Attempting to join 'admins' group...");
        const joined = await signalRService["connection"]?.invoke("JoinAdmins");
        addLog(`📊 JoinAdmins result: ${joined}`);
        
        if (joined) {
          addLog("✅ Successfully joined 'admins' group");
          setIsInAdminsGroup(true);
        } else {
          addLog("❌ Failed to join admins group - user may not have admin role");
          setIsInAdminsGroup(false);
          setError("Not in admins group - check your role permissions");
        }
      } catch (joinError: any) {
        addLog(`❌ Error calling JoinAdmins: ${joinError.message || joinError}`);
        setIsInAdminsGroup(false);
        setError("Failed to join admins group - you may not receive notifications");
      }
      
      setLastPing(new Date().toLocaleTimeString());
      setSuccess("Connected successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      addLog(`❌ Failed to connect: ${err instanceof Error ? err.message : "Unknown error"}`);
      setError(err instanceof Error ? err.message : "Connection failed");
      setIsInAdminsGroup(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError("");
      setSuccess("");
      addLog("🔌 Manual disconnect triggered...");
      await signalRService.stop();
      addLog("✅ Disconnected successfully");
      setSuccess("Disconnected successfully!");
      setIsInAdminsGroup(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      addLog(`❌ Failed to disconnect: ${err instanceof Error ? err.message : "Unknown error"}`);
      setError(err instanceof Error ? err.message : "Disconnect failed");
    }
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    addLog("🗑️ Cleared notifications list");
  };

  const handleTestNotification = async () => {
    setError("");
    setSuccess("");
    addLog("🧪 Sending test notification...");
    sendTestMutation.mutate();
  };

  const handleClearLogs = () => {
    setConsoleLogs([]);
  };

  const handleRejoinGroup = async () => {
    try {
      setError("");
      setSuccess("");
      addLog("🔄 Attempting to rejoin 'admins' group...");
      
      if (!signalRService["connection"] || signalRService["connection"].state !== "Connected") {
        addLog("❌ Cannot rejoin - not connected");
        setError("Must be connected first");
        return;
      }

      const joined = await signalRService["connection"].invoke("JoinAdmins");
      addLog(`📊 JoinAdmins result: ${joined}`);
      
      if (joined) {
        addLog("✅ Successfully rejoined 'admins' group");
        setIsInAdminsGroup(true);
        setSuccess("Rejoined admins group!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        addLog("❌ Failed to rejoin - user may not have admin role");
        setIsInAdminsGroup(false);
        setError("Not authorized as admin");
      }
    } catch (err: any) {
      addLog(`❌ Error rejoining group: ${err.message || err}`);
      setError(err.message || "Failed to rejoin group");
      setIsInAdminsGroup(false);
    }
  };

  const handleGetDiagnostics = async () => {
    try {
      setError("");
      setSuccess("");
      addLog("🔍 Requesting diagnostics from server...");
      
      if (!signalRService["connection"] || signalRService["connection"].state !== "Connected") {
        addLog("❌ Cannot get diagnostics - not connected");
        setError("Must be connected first");
        return;
      }

      const diagnostics = await signalRService["connection"].invoke("GetDiagnostics");
      addLog("📊 Diagnostics received:");
      addLog(JSON.stringify(diagnostics, null, 2));
      setSuccess("Diagnostics logged - check console logs panel");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      addLog(`❌ Error getting diagnostics: ${err.message || err}`);
      setError(err.message || "Failed to get diagnostics");
    }
  };

  const getConnectionColor = () => {
    switch (connectionState) {
      case "Connected":
        return "success";
      case "Connecting":
      case "Reconnecting":
        return "warning";
      case "Disconnected":
      case "Disconnecting":
        return "danger";
      default:
        return "medium";
    }
  };

  const getConnectionIcon = () => {
    switch (connectionState) {
      case "Connected":
        return checkmarkCircle;
      case "Connecting":
      case "Reconnecting":
        return refreshCircle;
      case "Disconnected":
      case "Disconnecting":
        return closeCircle;
      default:
        return warningOutline;
    }
  };

  return (
    <IonContent style={{ height: "100vh", background: "#f5f5f5" }}>
      <div style={{ padding: "20px", minHeight: "100%" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              color: "var(--ion-color-primary)",
              margin: "0 0 4px 0",
              fontSize: "28px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <IonIcon icon={wifiOutline} /> SignalR Connection Test
          </h1>
          <p style={{ color: "black", margin: "0", fontSize: "16px" }}>
            Test real-time SignalR connection and notifications
          </p>
        </div>

        {/* Connection Status Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Connection Status</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none">
              <IonItem>
                <IonIcon icon={getConnectionIcon()} slot="start" color={getConnectionColor()} />
                <IonLabel>
                  <h2>Status</h2>
                  <p>Current connection state</p>
                </IonLabel>
                <IonBadge color={getConnectionColor()} slot="end">
                  {connectionState}
                </IonBadge>
              </IonItem>

              <IonItem>
                <IonIcon icon={timeOutline} slot="start" color="medium" />
                <IonLabel>
                  <h2>Last Activity</h2>
                  <p>Most recent event</p>
                </IonLabel>
                <IonText slot="end">{lastPing || "N/A"}</IonText>
              </IonItem>

              <IonItem>
                <IonIcon icon={notificationsOutline} slot="start" color="medium" />
                <IonLabel>
                  <h2>Notifications Received</h2>
                  <p>Total count</p>
                </IonLabel>
                <IonBadge color="primary" slot="end">
                  {notifications.length}
                </IonBadge>
              </IonItem>

              <IonItem>
                <IonIcon 
                  icon={isInAdminsGroup ? checkmarkCircle : warningOutline} 
                  slot="start" 
                  color={isInAdminsGroup ? "success" : "warning"} 
                />
                <IonLabel>
                  <h2>Admins Group</h2>
                  <p>Membership status</p>
                </IonLabel>
                <IonBadge color={isInAdminsGroup ? "success" : "warning"} slot="end">
                  {isInAdminsGroup ? "Joined" : "Not Joined"}
                </IonBadge>
              </IonItem>
            </IonList>

            {error && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "#fee",
                  borderRadius: "8px",
                  border: "1px solid #fcc",
                }}
              >
                <IonText color="danger">
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    <strong>Error:</strong> {error}
                  </p>
                </IonText>
              </div>
            )}

            {success && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "#e6ffe6",
                  borderRadius: "8px",
                  border: "1px solid #4caf50",
                }}
              >
                <IonText color="success">
                  <p style={{ margin: 0, fontSize: "14px" }}>
                    <strong>✓ Success:</strong> {success}
                  </p>
                </IonText>
              </div>
            )}

            {/* Control Buttons */}
            <div
              style={{
                marginTop: "16px",
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <IonButton
                expand="block"
                onClick={handleConnect}
                disabled={isConnected}
                style={{ flex: 1 }}
              >
                Connect
              </IonButton>
              <IonButton
                expand="block"
                onClick={handleDisconnect}
                disabled={!isConnected}
                color="danger"
                style={{ flex: 1 }}
              >
                Disconnect
              </IonButton>
            </div>

            {/* Group Management */}
            <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
              <IonButton
                expand="block"
                onClick={handleRejoinGroup}
                disabled={!isConnected}
                color="tertiary"
                fill="outline"
                style={{ flex: 1 }}
              >
                <IonIcon icon={refreshCircle} slot="start" />
                Rejoin Group
              </IonButton>
              <IonButton
                expand="block"
                onClick={handleGetDiagnostics}
                disabled={!isConnected}
                color="medium"
                fill="outline"
                style={{ flex: 1 }}
              >
                Get Diagnostics
              </IonButton>
            </div>

            {/* Test Notification Button */}
            <div style={{ marginTop: "8px" }}>
              <IonButton
                expand="block"
                onClick={handleTestNotification}
                disabled={!isConnected || sendTestMutation.isPending}
                color="secondary"
              >
                <IonIcon icon={sendOutline} slot="start" />
                {sendTestMutation.isPending ? "Sending..." : "Send Test Notification"}
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Connection Info Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Connection Details</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="full">
              <IonItem>
                <IonLabel>
                  <p style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                    Hub URL
                  </p>
                  <p style={{ fontSize: "14px", wordBreak: "break-all" }}>
                    {signalRService["baseUrl"]}/hubs/notifications
                  </p>
                </IonLabel>
              </IonItem>

              <IonItem>
                <IonLabel>
                  <p style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                    Connection ID
                  </p>
                  <p style={{ fontSize: "14px", wordBreak: "break-all" }}>
                    {signalRService["connection"]?.connectionId || "Not connected"}
                  </p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Notifications List */}
        <IonCard>
          <IonCardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <IonCardTitle>Received Notifications</IonCardTitle>
              {notifications.length > 0 && (
                <IonButton size="small" fill="clear" onClick={handleClearNotifications}>
                  Clear
                </IonButton>
              )}
            </div>
          </IonCardHeader>
          <IonCardContent>
            {notifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
                <IonIcon
                  icon={notificationsOutline}
                  style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.3 }}
                />
                <p>No notifications received yet</p>
                <p style={{ fontSize: "14px" }}>
                  Notifications will appear here when sessions end
                </p>
              </div>
            ) : (
              <IonList>
                {notifications.map((notif, index) => (
                  <IonCard key={index} style={{ margin: "8px 0" }}>
                    <IonCardContent>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "8px",
                        }}
                      >
                        <IonChip color="primary">
                          <IonLabel>Table {notif.tableNumber}</IonLabel>
                        </IonChip>
                        <IonText style={{ fontSize: "12px", color: "#666" }}>
                          {new Date(notif.createdAt).toLocaleTimeString()}
                        </IonText>
                      </div>

                      <IonText>
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>
                          {notif.userName}
                        </h3>
                        <p style={{ margin: "0 0 8px 0", color: "#666", fontSize: "14px" }}>
                          {notif.message}
                        </p>
                      </IonText>

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          fontSize: "13px",
                          color: "#666",
                        }}
                      >
                        <span>Duration: {notif.duration}h</span>
                        <span>Amount: ₱{notif.amount}</span>
                      </div>

                      <div
                        style={{
                          marginTop: "8px",
                          fontSize: "11px",
                          color: "#999",
                          wordBreak: "break-all",
                        }}
                      >
                        Session ID: {notif.sessionId}
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </IonList>
            )}
          </IonCardContent>
        </IonCard>

        {/* Instructions Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>How to Test</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div style={{ marginBottom: "16px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "var(--ion-color-primary)" }}>
                🔍 Diagnostic Steps
              </h3>
              <ol style={{ paddingLeft: "20px", lineHeight: "1.8", margin: 0 }}>
                <li>Click <strong>"Connect"</strong> - wait for green "Connected" badge</li>
                <li>Check <strong>"Admins Group"</strong> shows "Joined"</li>
                <li>Click <strong>"Get Diagnostics"</strong> - verify your role in logs</li>
                <li>Click <strong>"Send Test Notification"</strong> - should arrive instantly</li>
                <li>Check console logs panel for detailed event flow</li>
              </ol>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "var(--ion-color-primary)" }}>
                ✅ Success Checklist
              </h3>
              <ul style={{ paddingLeft: "20px", lineHeight: "1.8", margin: 0 }}>
                <li>Status badge is <strong>green "Connected"</strong></li>
                <li>Admins Group shows <strong>"Joined"</strong></li>
                <li>Diagnostics shows role: <strong>"Admin"</strong> or <strong>"Super Admin"</strong></li>
                <li>Test notification appears in list within 1 second</li>
                <li>Console logs show "SessionEnded" event received</li>
              </ul>
            </div>

            <div
              style={{
                padding: "12px",
                background: "#fff7e6",
                borderRadius: "8px",
                border: "1px solid #ffd666",
              }}
            >
              <IonText color="warning">
                <p style={{ margin: 0, fontSize: "13px" }}>
                  <strong>⚠️ Troubleshooting:</strong> If "Admins Group" shows "Not Joined", 
                  click "Get Diagnostics" to check your role. You need "Admin" or "Super Admin" role.
                </p>
              </IonText>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Console Logs Card */}
        <IonCard>
          <IonCardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <IonCardTitle>Console Logs</IonCardTitle>
              {consoleLogs.length > 0 && (
                <IonButton size="small" fill="clear" onClick={handleClearLogs}>
                  Clear
                </IonButton>
              )}
            </div>
          </IonCardHeader>
          <IonCardContent>
            {consoleLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                <p>No logs yet - interact with the buttons above to see logs</p>
              </div>
            ) : (
              <div
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  background: "#1e1e1e",
                  padding: "12px",
                  borderRadius: "8px",
                  fontFamily: "monospace",
                  fontSize: "12px",
                }}
              >
                {consoleLogs.map((log, index) => (
                  <div
                    key={index}
                    style={{
                      color: log.includes("❌") || log.includes("Error")
                        ? "#ff6b6b"
                        : log.includes("✅") || log.includes("Success")
                          ? "#51cf66"
                          : log.includes("⚠️") || log.includes("Warning")
                            ? "#ffd43b"
                            : "#e0e0e0",
                      marginBottom: "4px",
                      paddingBottom: "4px",
                      borderBottom: "1px solid #333",
                    }}
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </IonCardContent>
        </IonCard>
      </div>
    </IonContent>
  );
};

export default SignalRTest;

