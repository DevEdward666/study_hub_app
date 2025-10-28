import React, { useState } from "react";
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonToast,
  IonIcon,
  IonText,
} from "@ionic/react";
import {
  settingsOutline,
  saveOutline,
  cashOutline,
} from "ionicons/icons";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { ConfirmToast } from "../components/common/ConfirmToast";
import { useConfirmation } from "../hooks/useConfirmation";
import "../Admin/styles/admin.css";
import "../Admin/styles/admin-responsive.css";

const GlobalSettings: React.FC = () => {
  // State for global settings
  const [fixedRate, setFixedRate] = useState<string>("25");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");

  // Confirmation hook
  const {
    isOpen: isConfirmOpen,
    options: confirmOptions,
    showConfirmation,
    handleConfirm: confirmAction,
    handleCancel: cancelAction,
    handleDismiss: dismissConfirm,
  } = useConfirmation();

  // Handle form submission
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate fixed rate
    if (!fixedRate || parseFloat(fixedRate) <= 0) {
      setToastMessage("Please enter a valid fixed rate amount");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    // Show confirmation dialog
    showConfirmation(
      {
        header: "Update Global Settings",
        message: `Are you sure you want to update the global fixed rate?\n\n` +
          `New Fixed Rate: ₱${fixedRate}\n\n` +
          `This will apply to all tables in the system.`,
        confirmText: "Update Settings",
        cancelText: "Cancel",
      },
      async () => {
        await saveSettings();
      }
    );
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Here you would call your API to save the global settings
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      setToastMessage(`✅ Global fixed rate updated to ₱${fixedRate} successfully!`);
      setToastColor("success");
      setShowToast(true);
      
      console.log("Global fixed rate saved:", fixedRate);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setToastMessage(`❌ Failed to update settings: ${error || "Unknown error"}`);
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  return (
    <IonContent>
      <div className="global-settings">
        <div className="page-header">
          <h1 style={{ color: 'var(--ion-color-primary)' }}>
            <IonIcon icon={settingsOutline} style={{ marginRight: '10px' }} />
            Global Settings
          </h1>
          <p>Configure system-wide settings for the study hub</p>
        </div>

        {/* Fixed Rate Settings Card */}
        <IonCard className="settings-card">
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={cashOutline} style={{ marginRight: '8px' }} />
              Fixed Rate Configuration
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Set the global fixed rate that will be applied to all study tables. 
              This rate represents the amount users will pay for using any table in the system.
            </p>

            <form onSubmit={handleSaveSettings} className="settings-form">
              <div className="form-group">
                <IonItem className="rate-input-item">
                  <IonLabel position="stacked" style={{ fontWeight: 'bold' }}>
                    Fixed Rate Amount (₱) *
                  </IonLabel>
                  <IonInput
                    type="number"
                    value={fixedRate}
                    placeholder="Enter amount (e.g., 100)"
                    min="1"
                    step="1"
                    required
                    onIonInput={(e) => setFixedRate(e.detail.value!)}
                    style={{ 
                      fontSize: '16px', 
                      fontWeight: '500',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '8px'
                    }}
                  />
                </IonItem>
                
                <div className="rate-preview" style={{ 
                  marginTop: '15px', 
                  padding: '15px', 
                  background: '#f8f9fa', 
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <IonText color="medium">
                    <small>Preview: Users will pay </small>
                  </IonText>
                  <IonText style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
                    ₱{fixedRate || '0'}
                  </IonText>
                  <IonText color="medium">
                    <small> to use any study table</small>
                  </IonText>
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '30px' }}>
                <IonButton
                  type="submit"
                  color="primary"
                  size="default"
                  disabled={isSaving || !fixedRate}
                  style={{ width: '100%' }}
                >
                  <IonIcon icon={saveOutline} slot="start" />
                  {isSaving ? "Saving Settings..." : "Save Global Settings"}
                </IonButton>
              </div>
            </form>

            <div className="settings-info" style={{ marginTop: '20px' }}>
              <IonText color="medium">
                <small>
                  <strong>Note:</strong> Changing the global fixed rate will affect all tables in the system. 
                  Active sessions will continue with their original rate, but new sessions will use the updated rate.
                </small>
              </IonText>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Additional Settings Cards can be added here */}
        <IonCard className="settings-card" style={{ marginTop: '20px' }}>
          <IonCardHeader>
            <IonCardTitle>
              Future Settings
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              Additional system settings will be available here in future updates.
            </p>
          </IonCardContent>
        </IonCard>
      </div>

      {/* Toast Notifications */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={4000}
        color={toastColor}
        position="top"
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
  );
};

export default GlobalSettings;