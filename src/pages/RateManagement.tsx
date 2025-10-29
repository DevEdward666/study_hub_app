import React, { useState, useEffect } from "react";
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
  IonList,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonToggle,
  IonTextarea,
  IonBadge,
} from "@ionic/react";
import {
  cashOutline,
  addOutline,
  createOutline,
  trashOutline,
  closeOutline,
  timeOutline,
  checkmarkCircle,
  closeCircle,
} from "ionicons/icons";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ConfirmToast } from "../components/common/ConfirmToast";
import { useConfirmation } from "../hooks/useConfirmation";
import rateService from "../services/rate.service";
import { Rate, CreateRateRequest, UpdateRateRequest } from "../schema/rate.schema";
import "../Admin/styles/admin.css";
import "../Admin/styles/admin-responsive.css";

const RateManagement: React.FC = () => {
  const [rates, setRates] = useState<Rate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateRateRequest>({
    hours: 1,
    price: 0,
    description: "",
    isActive: true,
    displayOrder: 0,
  });

  const {
    isOpen: isConfirmOpen,
    options: confirmOptions,
    showConfirmation,
    handleConfirm: confirmAction,
    handleCancel: cancelAction,
    handleDismiss: dismissConfirm,
  } = useConfirmation();

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    setIsLoading(true);
    try {
      const data = await rateService.getAllRates();
      setRates(data);
    } catch (error: any) {
      console.error("Failed to load rates:", error);
      setToastMessage(`❌ Failed to load rates: ${error.message || "Unknown error"}`);
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      hours: 1,
      price: 0,
      description: "",
      isActive: true,
      displayOrder: rates.length,
    });
    setShowCreateModal(true);
  };

  const handleEdit = (rate: Rate) => {
    setSelectedRate(rate);
    setFormData({
      hours: rate.hours,
      price: rate.price,
      description: rate.description || "",
      isActive: rate.isActive,
      displayOrder: rate.displayOrder,
    });
    setShowEditModal(true);
  };

  const handleSaveCreate = async () => {
    if (formData.hours <= 0 || formData.price <= 0) {
      setToastMessage("❌ Hours and price must be greater than 0");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    setIsSaving(true);
    try {
      await rateService.createRate(formData);
      setToastMessage("✅ Rate created successfully!");
      setToastColor("success");
      setShowToast(true);
      setShowCreateModal(false);
      await loadRates();
    } catch (error: any) {
      console.error("Failed to create rate:", error);
      setToastMessage(`❌ Failed to create rate: ${error.message || "Unknown error"}`);
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRate) return;

    if (formData.hours <= 0 || formData.price <= 0) {
      setToastMessage("❌ Hours and price must be greater than 0");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    setIsSaving(true);
    try {
      const updateRequest: UpdateRateRequest = {
        id: selectedRate.id,
        hours: formData.hours,
        price: formData.price,
        description: formData.description,
        isActive: formData.isActive ?? true,
        displayOrder: formData.displayOrder ?? 0,
      };
      await rateService.updateRate(updateRequest);
      setToastMessage("✅ Rate updated successfully!");
      setToastColor("success");
      setShowToast(true);
      setShowEditModal(false);
      await loadRates();
    } catch (error: any) {
      console.error("Failed to update rate:", error);
      setToastMessage(`❌ Failed to update rate: ${error.message || "Unknown error"}`);
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (rate: Rate) => {
    showConfirmation(
      {
        header: "Delete Rate",
        message: `Are you sure you want to delete the rate for ${rate.hours} hour(s) at ₱${rate.price}? This action cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
      },
      async () => {
        await performDelete(rate.id);
      }
    );
  };

  const performDelete = async (id: string) => {
    setIsSaving(true);
    try {
      await rateService.deleteRate(id);
      setToastMessage("✅ Rate deleted successfully!");
      setToastColor("success");
      setShowToast(true);
      await loadRates();
    } catch (error: any) {
      console.error("Failed to delete rate:", error);
      setToastMessage(`❌ Failed to delete rate: ${error.message || "Unknown error"}`);
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading rates..." />;
  }

  return (
    <IonContent>
      <div className="rate-management" style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: "24px" }}>
          <h1 style={{ color: "var(--ion-color-primary)", display: "flex", alignItems: "center", gap: "12px" }}>
            <IonIcon icon={cashOutline} />
            Rate Management
          </h1>
          <p style={{ color: "#666", marginTop: "8px" }}>
            Manage hourly rates for table sessions (e.g., 1 hour for ₱35, 2 hours for ₱135)
          </p>
        </div>

        {/* Create Button */}
        <div style={{ marginBottom: "20px" }}>
          <IonButton onClick={handleCreate} color="success">
            <IonIcon icon={addOutline} slot="start" />
            Add New Rate
          </IonButton>
        </div>

        {/* Rates List */}
        {rates.length === 0 ? (
          <IonCard>
            <IonCardContent style={{ textAlign: "center", padding: "40px" }}>
              <IonIcon icon={cashOutline} style={{ fontSize: "64px", color: "#ccc", marginBottom: "16px" }} />
              <IonText color="medium">
                <p>No rates configured yet. Click "Add New Rate" to create one.</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonList>
            {rates.map((rate) => (
              <IonCard key={rate.id} style={{ marginBottom: "12px" }}>
                <IonCardContent>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <IonIcon icon={timeOutline} style={{ fontSize: "24px", color: "var(--ion-color-primary)" }} />
                        <div>
                          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>
                            {rate.hours} {rate.hours === 1 ? "Hour" : "Hours"}
                          </h3>
                          <p style={{ margin: "4px 0 0 0", fontSize: "24px", color: "var(--ion-color-success)", fontWeight: "bold" }}>
                            ₱{rate.price.toFixed(2)}
                          </p>
                        </div>
                        <IonBadge color={rate.isActive ? "success" : "medium"} style={{ marginLeft: "8px" }}>
                          {rate.isActive ? "Active" : "Inactive"}
                        </IonBadge>
                      </div>
                      {rate.description && (
                        <IonText color="medium" style={{ fontSize: "13px", display: "block", marginTop: "8px" }}>
                          {rate.description}
                        </IonText>
                      )}
                      <IonText color="medium" style={{ fontSize: "11px", display: "block", marginTop: "8px" }}>
                        Display Order: {rate.displayOrder} | Created: {new Date(rate.createdAt).toLocaleDateString()}
                      </IonText>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
                      <IonButton size="small" fill="outline" onClick={() => handleEdit(rate)}>
                        <IonIcon icon={createOutline} slot="icon-only" />
                      </IonButton>
                      <IonButton size="small" fill="outline" color="danger" onClick={() => handleDelete(rate)}>
                        <IonIcon icon={trashOutline} slot="icon-only" />
                      </IonButton>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}

        {/* Create Modal */}
        <IonModal isOpen={showCreateModal} onDidDismiss={() => setShowCreateModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Create New Rate</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowCreateModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Hours *</IonLabel>
              <IonInput
                type="number"
                value={formData.hours}
                onIonInput={(e) => setFormData({ ...formData, hours: parseInt(e.detail.value || "1") })}
                placeholder="Enter number of hours"
                min={1}
                max={24}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Price (₱) *</IonLabel>
              <IonInput
                type="number"
                value={formData.price}
                onIonInput={(e) => setFormData({ ...formData, price: parseFloat(e.detail.value || "0") })}
                placeholder="Enter price"
                min={0.01}
                step="0.01"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Description</IonLabel>
              <IonTextarea
                value={formData.description}
                onIonInput={(e) => setFormData({ ...formData, description: e.detail.value || "" })}
                placeholder="Optional description"
                rows={3}
              />
            </IonItem>
            <IonItem>
              <IonLabel>Active</IonLabel>
              <IonToggle
                checked={formData.isActive}
                onIonChange={(e) => setFormData({ ...formData, isActive: e.detail.checked })}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Display Order</IonLabel>
              <IonInput
                type="number"
                value={formData.displayOrder}
                onIonInput={(e) => setFormData({ ...formData, displayOrder: parseInt(e.detail.value || "0") })}
                placeholder="0"
              />
            </IonItem>
            <div style={{ marginTop: "24px" }}>
              <IonButton expand="block" onClick={handleSaveCreate} disabled={isSaving}>
                {isSaving ? "Creating..." : "Create Rate"}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Edit Modal */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Rate</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Hours *</IonLabel>
              <IonInput
                type="number"
                value={formData.hours}
                onIonInput={(e) => setFormData({ ...formData, hours: parseInt(e.detail.value || "1") })}
                placeholder="Enter number of hours"
                min={1}
                max={24}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Price (₱) *</IonLabel>
              <IonInput
                type="number"
                value={formData.price}
                onIonInput={(e) => setFormData({ ...formData, price: parseFloat(e.detail.value || "0") })}
                placeholder="Enter price"
                min={0.01}
                step="0.01"
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Description</IonLabel>
              <IonTextarea
                value={formData.description}
                onIonInput={(e) => setFormData({ ...formData, description: e.detail.value || "" })}
                placeholder="Optional description"
                rows={3}
              />
            </IonItem>
            <IonItem>
              <IonLabel>Active</IonLabel>
              <IonToggle
                checked={formData.isActive}
                onIonChange={(e) => setFormData({ ...formData, isActive: e.detail.checked })}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Display Order</IonLabel>
              <IonInput
                type="number"
                value={formData.displayOrder}
                onIonInput={(e) => setFormData({ ...formData, displayOrder: parseInt(e.detail.value || "0") })}
                placeholder="0"
              />
            </IonItem>
            <div style={{ marginTop: "24px" }}>
              <IonButton expand="block" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Toast Notifications */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={4000}
          color={toastColor}
          position="top"
        />

        {/* Confirmation Dialog */}
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
      </div>
    </IonContent>
  );
};

export default RateManagement;

