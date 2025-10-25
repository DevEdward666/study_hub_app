// src/pages/premise/PremiseAccess.tsx
import React, { useState } from "react";
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
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonBadge,
  IonProgressBar,
  RefresherEventDetail,
} from "@ionic/react";
import {
  businessOutline,
  qrCodeOutline,
  timeOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  refreshOutline,
} from "ionicons/icons";
import { usePremise } from "../../hooks/PremiseHooks";
import { useQRScanner } from "../../hooks/QrScannerHooks";
import { useConfirmation } from "../../hooks/useConfirmation";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ConfirmToast } from "../../components/common/ConfirmToast";
import "./PremiseAccess.css";
import { Scanner } from "@yudiel/react-qr-scanner";

const PremiseAccess: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<
    "success" | "danger" | "warning"
  >("success");

  // Confirmation hook
  const {
    isOpen: isConfirmOpen,
    options: confirmOptions,
    showConfirmation,
    handleConfirm: confirmAction,
    handleCancel: cancelAction,
    handleDismiss: dismissConfirm
  } = useConfirmation();

  const {
    access,
    isLoadingAccess,
    activateAccess,
    cleanupExpired,
    refetchAccess,
  } = usePremise();

  const { startScan, isScanning, hasPermission, checkPermission } =
    useQRScanner();

  React.useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetchAccess();
    event.detail.complete();
  };

  const handleActivateAccess = async () => {
    try {
      const result = await startScan();
      if (result) {
        showConfirmation({
          header: 'Activate Premise Access',
          message: `Activate premise access with code: ${result}?\n\nThis will grant you access to the premise.`,
          confirmText: 'Activate',
          cancelText: 'Cancel'
        }, async () => {
          try {
            await activateAccess.mutateAsync({
              activationCode: result,
            });
            setToastMessage("Premise access activated successfully!");
            setToastColor("success");
            setShowToast(true);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Failed to activate access";
            setToastMessage(message);
            setToastColor("danger");
            setShowToast(true);
          }
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to scan QR code";
      setToastMessage(message);
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const handleCleanupExpired = async () => {
    showConfirmation({
      header: 'Clean Up Expired Access',
      message: "Clean up expired premise access codes?\n\nThis will permanently remove all expired access codes from the system.",
      confirmText: 'Clean Up',
      cancelText: 'Cancel'
    }, async () => {
      try {
        await cleanupExpired.mutateAsync();
        await refetchAccess();
        setToastMessage("Expired access codes cleaned up successfully!");
        setToastColor("success");
        setShowToast(true);
      } catch (error) {
        console.error("Failed to cleanup expired access:", error);
        setToastMessage("Failed to clean up expired access codes");
        setToastColor("danger");
        setShowToast(true);
      }
    });
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getProgressPercentage = (): number => {
    if (!access) return 0;

    const now = Date.now();
    const start = new Date(access.activatedAt).getTime();
    const end = new Date(access.expiresAt).getTime();
    const elapsed = now - start;
    const total = end - start;

    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  const isExpiringSoon = (): boolean => {
    if (!access) return false;
    return access.timeRemaining < 30 * 60 * 1000; // Less than 30 minutes
  };

  React.useEffect(() => {
    if (access && access.timeRemaining <= 0) {
      handleCleanupExpired();
    }
  }, [access]);

  if (isLoadingAccess) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Premise Access</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <LoadingSpinner message="Loading access status..." />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Premise Access</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="premise-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="premise-container">
          {/* Access Status Card */}
          {access ? (
            <IonCard className="access-card active">
              <IonCardHeader>
                <IonCardTitle className="access-title">
                  <IonIcon
                    icon={checkmarkCircleOutline}
                    className="access-icon active"
                  />
                  <div className="title-content">
                    <span>Access Active</span>
                    <IonBadge color="success" className="access-badge">
                      Valid
                    </IonBadge>
                  </div>
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="access-details">
                  <div className="location-info">
                    <h3>{access.location || "Study Premise"}</h3>
                    <p>Access granted and active</p>
                  </div>

                  <div className="time-info">
                    <div className="time-remaining">
                      <IonIcon icon={timeOutline} />
                      <span className={isExpiringSoon() ? "time-warning" : ""}>
                        {formatTimeRemaining(access.timeRemaining)} remaining
                      </span>
                    </div>

                    <div className="progress-container">
                      <IonProgressBar
                        value={getProgressPercentage() / 100}
                        color={isExpiringSoon() ? "warning" : "success"}
                      />
                      <span className="progress-text">
                        {Math.round(getProgressPercentage())}% elapsed
                      </span>
                    </div>
                  </div>

                  <div className="access-timestamps">
                    <div className="timestamp">
                      <span className="timestamp-label">Activated:</span>
                      <span className="timestamp-value">
                        {new Date(access.activatedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="timestamp">
                      <span className="timestamp-label">Expires:</span>
                      <span className="timestamp-value">
                        {new Date(access.expiresAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {isExpiringSoon() && (
                  <div className="warning-message">
                    <IonIcon icon={alertCircleOutline} />
                    <span>
                      Access will expire soon. Please scan the premise QR code
                      to extend.
                    </span>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          ) : (
            <IonCard className="access-card inactive">
              <IonCardHeader>
                <IonCardTitle className="access-title">
                  <IonIcon
                    icon={businessOutline}
                    className="access-icon inactive"
                  />
                  <div className="title-content">
                    <span>No Active Access</span>
                    <IonBadge color="medium" className="access-badge">
                      Inactive
                    </IonBadge>
                  </div>
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="no-access-content">
                  <p>
                    You don't have active premise access. Scan a premise QR code
                    to gain entry.
                  </p>
                </div>
              </IonCardContent>
            </IonCard>
          )}

          {/* Actions */}

          <div className="premise-actions">
            {!access ? (
              <IonCard className="action-card">
                <IonCardContent>
                  <div className="action-content">
                    <div className="action-header">
                      <div className="action-info">
                        <IonButton
                          expand="block"
                          fill="solid"
                          onClick={handleActivateAccess}
                          disabled={
                            isScanning ||
                            activateAccess.isPending ||
                            hasPermission === false
                          }
                          className="scan-premise-button"
                        >
                          {isScanning ? (
                            <>Scanning...</>
                          ) : activateAccess.isPending ? (
                            <>Activating...</>
                          ) : hasPermission === false ? (
                            <>Camera Permission Required</>
                          ) : (
                            <>
                              <IonIcon icon={qrCodeOutline} slot="start" />
                              {access ? "Extend Access" : "Scan for Access"}
                            </>
                          )}
                        </IonButton>
                      </div>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ) : null}
            {/* Instructions */}
            <IonCard className="instructions-card">
              <IonCardContent>
                <h3>How Premise Access Works</h3>
                <div className="instructions-list">
                  <div className="instruction-item">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h4>Locate QR Code</h4>
                      <p>
                        Find the premise QR code at the main entrance or
                        reception desk
                      </p>
                    </div>
                  </div>

                  <div className="instruction-item">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h4>Scan Code</h4>
                      <p>Use the scanner above to scan the premise QR code</p>
                    </div>
                  </div>

                  <div className="instruction-item">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h4>Access Granted</h4>
                      <p>You'll receive timed access to the study premise</p>
                    </div>
                  </div>

                  <div className="instruction-item">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h4>Monitor Time</h4>
                      <p>
                        Keep track of your remaining access time in this screen
                      </p>
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </div>

          {hasPermission === false && (
            <IonCard className="permission-card">
              <IonCardContent>
                <div className="permission-content">
                  <IonIcon
                    icon={alertCircleOutline}
                    className="permission-icon"
                  />
                  <h3>Camera Permission Required</h3>
                  <p>
                    Please grant camera permission to scan premise QR codes.
                  </p>
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={checkPermission}
                  >
                    Grant Permission
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          )}
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
        />

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

export default PremiseAccess;
