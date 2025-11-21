import React, { useState } from "react";
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
  IonModal,
  IonRange,
  IonLabel,
  IonItem,
  IonList,
} from "@ionic/react";
import { qrCodeOutline, cameraOutline, closeOutline, notificationsOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useQRScanner } from "../../hooks/QrScannerHooks";
import { useTableByQR } from "../../hooks/TableHooks";
import { useTables } from "../../hooks/TableHooks";
import { useUser } from "../../hooks/UserHooks";
import { useConfirmation } from "../../hooks/useConfirmation";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ConfirmToast } from "../../components/common/ConfirmToast";
import { useNotifications } from "../../hooks/useNotifications";
import "./TableScanner.css";
import { Scanner } from "@yudiel/react-qr-scanner";
const TableScanner: React.FC = () => {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [timeMs, setTimeMs] = useState<number>(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ message: "", color: "" });
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [isScanning, setScanning] = useState(false);
  const [selectedHours, setSelectedHours] = useState<number>(1);
  const history = useHistory();
  const { credits } = useUser();


  // Confirmation hook
  const {
    isOpen: isConfirmOpen,
    options: confirmOptions,
    showConfirmation,
    handleConfirm: confirmAction,
    handleCancel: cancelAction,
    handleDismiss: dismissConfirm
  } = useConfirmation();

  // Notifications hook
  const {
    notifySessionStart,
    setupSessionMonitoring,
    isSupported: isPushSupported,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    requestPermission,
  } = useNotifications();

  // const { startScan, stopScan, isScanning, hasPermission, checkPermission } = useQRScanner();
  const { data: scannedTable, isLoading: isLoadingTable } =
    useTableByQR(scannedCode);
  const { startSession, activeSession, tables } = useTables();

  // Helper: parse ISO string to Date safely
  const parseDate = (v?: string | null) => (v ? new Date(v) : null);

  // Update timer every second when there's an active session
  React.useEffect(() => {
    if (!activeSession) {
      setTimeMs(0);
      return;
    }

    const start = parseDate(activeSession.startTime);
    const end = parseDate(activeSession.endTime);

    const update = () => {
      const now = new Date();
      if (end) {
        // remaining time until end
        setTimeMs(Math.max(0, end.getTime() - now.getTime()));
      } else if (start) {
        // elapsed time since start
        setTimeMs(Math.max(0, now.getTime() - start.getTime()));
      } else {
        setTimeMs(0);
      }
    };

    update();
    const id = window.setInterval(update, 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  // Format milliseconds into HH:MM:SS or MM:SS
  const formatMs = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const two = (n: number) => n.toString().padStart(2, "0");
    if (hours > 0) return `${hours}:${two(minutes)}:${two(seconds)}`;
    return `${two(minutes)}:${two(seconds)}`;
  };

  // React.useEffect(() => {
  //   checkPermission();
  // }, [checkPermission]);

  const handleScanResult = async (result: any) => {
    if (activeSession) {
      setToastMessage({
        message: "Please end your current session before starting a new one",
        color: "warning",
      });
      setShowToast(true);
      return;
    }

    try {
      // const result = await startScan();
      // if (result) {
      setScannedCode(result[0]?.rawValue);
      setScanning(false);
      // }`
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to scan QR code";

      setToastMessage({
        message: message,
        color: "danger",
      });
      setShowToast(true);
    }
  };

  const handleStopScan = async () => {
    // await stopScan();
    setScanning(false);
  };

  const handleStartSession = async () => {
    if (scannedTable && scannedCode) {
      // Show confirmation dialog
      const totalCredits = selectedHours;

      showConfirmation({
        header: 'Start Study Session',
        message: `Start study session at Table ${scannedTable.tableNumber}?\n\n` +
          `Location: ${scannedTable.location}\n` +
          `Duration: ${selectedHours} hour${selectedHours > 1 ? 's' : ''}\n` +
          `Credits needed: ${totalCredits}\n` +
          `Your balance: ${credits?.balance || 0} credits\n\n` +
          `Session will start immediately.`,
        confirmText: 'Start Session',
        cancelText: 'Cancel'
      }, async () => {
        try {
          const endTime = new Date();
          endTime.setHours(endTime.getHours() + selectedHours);

          // Calculate the amount based on hours and hourly rate
          const amount = selectedHours;

          await startSession.mutateAsync({
            tableId: scannedTable.id,
            qrCode: scannedCode,
            hours: selectedHours,
            endTime: endTime.toISOString(),
            amount: amount,
          });

          // Send session start notification
          if (isPushSupported && pushPermission === "granted") {
            try {
              await notifySessionStart(
                scannedTable.id, // Will be replaced with actual session ID by service
                scannedTable.tableNumber,
                scannedTable.location,
                selectedHours
              );

              // Setup monitoring for 30-minute warning
              setupSessionMonitoring(
                scannedTable.id, // Will be replaced with actual session ID 
                scannedTable.tableNumber,
                new Date(),
                selectedHours * 60 // Convert hours to minutes
              );
            } catch (notifError) {
              console.error("Failed to send notification:", notifError);
            }
          }

          setShowConfirmAlert(false);
          setSelectedHours(1); // Reset to default
          history.push("/app/dashboard");
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to start session";
          setToastMessage({
            message: message,
            color: "danger",
          });
          setShowToast(true);
        }
      });
    }
  };

  React.useEffect(() => {
    if (scannedTable && scannedCode) {
      setSelectedHours(1); // Reset to default when new scan
      setShowConfirmAlert(true);
    }
  }, [scannedTable, scannedCode]);

  // if (hasPermission === false) {
  //   return (
  //     <IonPage>
  //       <IonHeader>
  //         <IonToolbar>
  //           <IonTitle>QR Scanner</IonTitle>
  //         </IonToolbar>
  //       </IonHeader>
  //       <IonContent className="scanner-content">
  //         <div className="scanner-container">
  //           <IonCard className="permission-card">
  //             <IonCardContent>
  //               <div className="permission-content">
  //                 <IonIcon icon={cameraOutline} className="permission-icon" />
  //                 <h2>Camera Permission Required</h2>
  //                 <p>Please allow camera access to scan QR codes</p>
  //                 <IonButton expand="block" onClick={checkPermission}>
  //                   Grant Permission
  //                 </IonButton>
  //               </div>
  //             </IonCardContent>
  //           </IonCard>
  //         </div>
  //       </IonContent>
  //     </IonPage>
  //   );
  // }
  const handleStartScan = () => {
    setScanning(true);
  };
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>QR Scanner</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {activeSession ? (
          <IonContent fullscreen className="active-session-content">
            <div className="active-session-wrapper">
              <IonCard className="active-session-card">
                <IonCardContent>
                  <div className="active-session-info">
                    <div className="session-header">
                      <h2>Active Study Session</h2>
                      <div className="session-status-badge">
                        <span className="status-dot"></span>
                        In Progress
                      </div>
                    </div>

                    {/* Timer - Most Important Info */}
                    <div className="session-timer-container">
                      <div className="timer-label">
                        {activeSession.endTime ? "⏱️ Time Remaining" : "⏱️ Time Elapsed"}
                      </div>
                      <div className="timer-display">
                        {formatMs(timeMs)}
                      </div>
                      {activeSession.endTime && timeMs > 0 && (
                        <div className="timer-progress-bar">
                          <div
                            className="timer-progress-fill"
                            style={{
                              width: `${Math.max(0, Math.min(100, (timeMs / (parseDate(activeSession.endTime)!.getTime() - parseDate(activeSession.startTime)!.getTime())) * 100))}%`
                            }}
                          ></div>
                        </div>
                      )}
                    </div>

                    {/* Table Information */}
                    {activeSession.table && (
                      <div className="session-table-info">
                        <h3 className="section-title">📍 Table Details</h3>
                        <div className="table-info-grid">
                          <div className="info-item">
                            <span className="info-icon">🪑</span>
                            <div className="info-content">
                              <span className="info-label">Table Number</span>
                              <span className="info-value">{activeSession.table.tableNumber}</span>
                            </div>
                          </div>
                          <div className="info-item">
                            <span className="info-icon">📌</span>
                            <div className="info-content">
                              <span className="info-label">Location</span>
                              <span className="info-value">{activeSession.table.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Session Timeline */}
                    <div className="session-timeline">
                      <h3 className="section-title">🕐 Session Timeline</h3>
                      <div className="timeline-item">
                        <div className="timeline-dot timeline-dot-start"></div>
                        <div className="timeline-content">
                          <span className="timeline-label">Started</span>
                          <span className="timeline-value">
                            {activeSession.startTime
                              ? new Date(activeSession.startTime).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                              : "-"}
                          </span>
                        </div>
                      </div>

                      {activeSession.endTime && (
                        <div className="timeline-item">
                          <div className="timeline-dot timeline-dot-end"></div>
                          <div className="timeline-content">
                            <span className="timeline-label">Scheduled End</span>
                            <span className="timeline-value">
                              {new Date(activeSession.endTime).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <IonButton
                      expand="block"
                      fill="outline"
                      className="view-dashboard-button"
                      onClick={() => history.push('/app/dashboard')}
                    >
                      View Dashboard
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          </IonContent>
        ) : (
          <IonContent fullscreen className="scanner-content">
            <div className="scanner-container">
              {!isScanning && !scannedCode && (
                <div className="scanner-idle">
                  <IonCard className="scanner-card">
                    <IonCardContent>
                      <div className="scanner-idle-content">
                        <IonIcon icon={qrCodeOutline} className="scanner-icon" />
                        <h2>Scan Table QR Code</h2>
                        <p>
                          Point your camera at a table QR code to start a study
                          session
                        </p>

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
                    {/* <div className="scanner-frame">
                  <div className="scanner-corners">
                    <div className="corner top-left"></div>
                    <div className="corner top-right"></div>
                    <div className="corner bottom-left"></div>
                    <div className="corner bottom-right"></div>
                  </div>
                </div> */}

                    <div className="scanner-instructions">
                      <Scanner onScan={(result) => handleScanResult(result)} />
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
          </IonContent>
        )}


        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage.message}
          duration={3000}
          color={toastMessage.color}
        />

        <IonModal
          isOpen={showConfirmAlert}
          onDidDismiss={() => {
            setShowConfirmAlert(false);
            setScannedCode(null);
            setSelectedHours(1);
          }}
          initialBreakpoint={0.95}
          breakpoints={[0, 0.95]}
          className="session-confirm-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Start Study Session</IonTitle>
            </IonToolbar>
          </IonHeader>
          {scannedTable ? (
            <div className="modal-content">
              <div className="table-info-section">
                <h2 className="table-number">Table {scannedTable.tableNumber}</h2>
                <div className="table-details">
                  <IonItem lines="none">
                    <IonLabel>
                      <p className="detail-label">Location</p>
                      <h3 className="detail-value">{scannedTable.location}</h3>
                    </IonLabel>
                  </IonItem>
                  <IonItem lines="none">
                    <IonLabel>
                      <p className="detail-label">Capacity</p>
                      <h3 className="detail-value">{scannedTable.capacity} person(s)</h3>
                    </IonLabel>
                  </IonItem>
                  <IonItem lines="none">
                    <IonLabel>
                      <p className="detail-label">Rate per Hour</p>
                      <h3 className="detail-value"> credits/hour</h3>
                    </IonLabel>
                  </IonItem>
                </div>
              </div>

              <div className="hours-selection-section">
                <IonLabel className="section-label">
                  <h3>Select Duration</h3>
                </IonLabel>
                <div className="hours-selector">
                  <div className="hours-display">
                    <span className="hours-number">{selectedHours}</span>
                    <span className="hours-text">{selectedHours === 1 ? 'Hour' : 'Hours'}</span>
                  </div>
                  <IonRange
                    min={1}
                    max={12}
                    step={1}
                    value={selectedHours}
                    onIonChange={(e) => setSelectedHours(e.detail.value as number)}
                    pin={false}
                    className="hours-range"
                  />
                  <div className="range-labels">
                    <span>1h</span>
                    <span>12h</span>
                  </div>
                </div>
              </div>

              <div className="credits-summary">
                <div className="summary-row">
                  <span className="summary-label">Duration:</span>
                  <span className="summary-value">{selectedHours} {selectedHours === 1 ? 'hour' : 'hours'}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Rate:</span>
                  <span className="summary-value"> credits/hour</span>
                </div>
                <div className="summary-row total">
                  <span className="summary-label">Total Credits:</span>
                  <span className="summary-value highlight">{selectedHours} credits</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">End Time:</span>
                  <span className="summary-value">
                    {new Date(new Date().getTime() + selectedHours * 60 * 60 * 1000).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              <div className="modal-buttons">
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={() => {
                    setShowConfirmAlert(false);
                    setScannedCode(null);
                    setSelectedHours(1);
                  }}
                >
                  Cancel
                </IonButton>
                <IonButton
                  expand="block"
                  onClick={handleStartSession}
                  className="start-session-btn"
                >
                  Start Session
                </IonButton>
              </div>
            </div>
          ) : (
            <div className="modal-content">
              <div className="error-content">
                <IonIcon icon={closeOutline} className="error-icon" />
                <h2>Invalid QR Code</h2>
                <p>The scanned QR code is not associated with any table.</p>
                <IonButton
                  expand="block"
                  onClick={() => {
                    setShowConfirmAlert(false);
                    setScannedCode(null);
                  }}
                >
                  OK
                </IonButton>
              </div>
            </div>
          )}
        </IonModal>

        {/* Confirmation Toast */}
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
      </IonContent>

    </IonPage>
  );
};

export default TableScanner;
