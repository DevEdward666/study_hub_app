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
  IonToggle,
  IonTextarea,
  IonBadge,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import {
  addOutline,
  createOutline,
  trashOutline,
  closeOutline,
} from "ionicons/icons";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useConfirmation } from "../hooks/useConfirmation";
import { ConfirmToast } from "../components/common/ConfirmToast";
import {
  useSubscriptionPackages,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
} from "../hooks/SubscriptionHooks";
import { SubscriptionPackage, CreateSubscriptionPackage } from "../schema/subscription.schema";
import "../Admin/styles/admin.css";
import "../styles/side-modal.css";

const SubscriptionPackageManagement: React.FC = () => {
  const { data: packages, isLoading } = useSubscriptionPackages();
  const createMutation = useCreatePackage();
  const updateMutation = useUpdatePackage();
  const deleteMutation = useDeletePackage();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);

  const [formData, setFormData] = useState<CreateSubscriptionPackage>({
    name: "",
    packageType: "Hourly",
    durationValue: 1,
    totalHours: 1,
    price: 0,
    description: "",
    displayOrder: 0,
  });

  const {
    isOpen: isConfirmOpen,
    options: confirmOptions,
    showConfirmation,
    handleConfirm,
    handleCancel,
    handleDismiss,
  } = useConfirmation();

  // Calculate total hours based on package type
  const calculateTotalHours = (type: string, value: number): number => {
    switch (type) {
      case "Hourly":
        return value;
      case "Daily":
        return value * 24;
      case "Weekly":
        return value * 168;
      case "Monthly":
        return value * 720;
      default:
        return value;
    }
  };

  const handleDurationChange = (type: string, value: number) => {
    const totalHours = calculateTotalHours(type, value);
    setFormData({
      ...formData,
      packageType: type,
      durationValue: value,
      totalHours,
    });
  };

  const formatPackageName = (pkg: SubscriptionPackage): string => {
    const value = pkg.durationValue;
    const type = pkg.packageType;

    if (type === "Hourly") return `${value} Hour${value > 1 ? "s" : ""}`;
    if (type === "Daily") return `${value} Day${value > 1 ? "s" : ""}`;
    if (type === "Weekly") return `${value} Week${value > 1 ? "s" : ""}`;
    if (type === "Monthly") return `${value} Month${value > 1 ? "s" : ""}`;
    return pkg.name;
  };

  const handleCreate = () => {
    setFormData({
      name: "",
      packageType: "Hourly",
      durationValue: 1,
      totalHours: 1,
      price: 0,
      description: "",
      displayOrder: packages?.length || 0,
    });
    setShowCreateModal(true);
  };

  const handleEdit = (pkg: SubscriptionPackage) => {
    setSelectedPackage(pkg);
    setFormData({
      name: pkg.name,
      packageType: pkg.packageType,
      durationValue: pkg.durationValue,
      totalHours: pkg.totalHours,
      price: pkg.price,
      description: pkg.description || "",
      displayOrder: pkg.displayOrder,
    });
    setShowEditModal(true);
  };

  const handleSaveCreate = async () => {
    if (!formData.name || formData.price <= 0) {
      setToastMessage("❌ Name and price are required");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      setToastMessage("✅ Package created successfully!");
      setToastColor("success");
      setShowToast(true);
      setShowCreateModal(false);
    } catch (error: any) {
      setToastMessage(`❌ Failed to create package: ${error.message}`);
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPackage) return;

    try {
      await updateMutation.mutateAsync({
        packageId: selectedPackage.id,
        data: {
          name: formData.name,
          price: formData.price,
          description: formData.description,
          isActive: true,
          displayOrder: formData.displayOrder,
        },
      });
      setToastMessage("✅ Package updated successfully!");
      setToastColor("success");
      setShowToast(true);
      setShowEditModal(false);
    } catch (error: any) {
      setToastMessage(`❌ Failed to update package: ${error.message}`);
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const handleDelete = (pkg: SubscriptionPackage) => {
    showConfirmation(
      {
        header: "Delete Package",
        message: `Are you sure you want to delete "${pkg.name}"? This action cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
      },
      async () => {
        try {
          await deleteMutation.mutateAsync(pkg.id);
          setToastMessage("✅ Package deleted successfully!");
          setToastColor("success");
          setShowToast(true);
        } catch (error: any) {
          setToastMessage(`❌ Failed to delete package: ${error.message}`);
          setToastColor("danger");
          setShowToast(true);
        }
      }
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading subscription packages..." />;
  }

  return (
    <IonContent>
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2 style={{ color: 'var(--ion-color-primary)' }}> Subscription Packages</h2>
            <p> Manage subscription packages for long-term customers (hourly, daily, weekly, monthly)</p>
          </div>

          <div className="header-actions">
            <IonButton onClick={handleCreate} color="primary" style={{ fontWeight: 500 }}>
              <IonIcon icon={addOutline} slot="start" />
              Add New Package
            </IonButton>
          </div>
        </div>
      </div>


      {/* Packages List */}
      {!packages || packages.length === 0 ? (
        <IonCard>
          <IonCardContent style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "64px", color: "#e0e0e0", marginBottom: "16px" }}>📦</div>
            <IonText color="medium">
              <p style={{ fontSize: "16px", fontWeight: 500 }}>No subscription packages yet</p>
              <p style={{ fontSize: "14px", color: "#999" }}>Click "Add New Package" to create your first package.</p>
            </IonText>
          </IonCardContent>
        </IonCard>
      ) : (
        <IonList style={{ background: "transparent" }}>
          {packages.map((pkg) => (
            <IonCard key={pkg.id} style={{ marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <IonCardContent style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" }}>
                  <div style={{ flex: 1 }}>
                    {/* Package Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#000" }}>
                            {pkg.name}
                          </h3>
                          <IonBadge
                            color={pkg.isActive ? "success" : "medium"}
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                          >
                            {pkg.isActive ? "Active" : "Inactive"}
                          </IonBadge>
                        </div>

                        {/* Price */}
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "8px" }}>
                          <span style={{ fontSize: "28px", fontWeight: 700, color: "#2196F3" }}>
                            ₱{pkg.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Package Details */}
                    <div style={{
                      display: "flex",
                      gap: "16px",
                      flexWrap: "wrap",
                      marginTop: "12px",
                      paddingTop: "12px",
                      borderTop: "1px solid #f0f0f0"
                    }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "11px", color: "#999", textTransform: "uppercase", fontWeight: 500 }}>
                          Duration
                        </span>
                        <span style={{ fontSize: "14px", color: "#333", fontWeight: 600, marginTop: "4px" }}>
                          {formatPackageName(pkg)}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "11px", color: "#999", textTransform: "uppercase", fontWeight: 500 }}>
                          Total Hours
                        </span>
                        <span style={{ fontSize: "14px", color: "#333", fontWeight: 600, marginTop: "4px" }}>
                          {pkg.totalHours} hrs
                        </span>
                      </div>
                      {pkg.description && (
                        <div style={{ display: "flex", flexDirection: "column", flex: "1 1 100%" }}>
                          <span style={{ fontSize: "11px", color: "#999", textTransform: "uppercase", fontWeight: 500 }}>
                            Description
                          </span>
                          <span style={{ fontSize: "13px", color: "#666", marginTop: "4px", lineHeight: "1.5" }}>
                            {pkg.description}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "80px" }}>
                    <IonButton
                      size="small"
                      fill="outline"
                      onClick={() => handleEdit(pkg)}
                      color="medium"
                      style={{ margin: 0 }}
                    >
                      <IonIcon icon={createOutline} slot="start" style={{ fontSize: "16px" }} />
                      Edit
                    </IonButton>
                    <IonButton
                      size="small"
                      fill="outline"
                      color="danger"
                      onClick={() => handleDelete(pkg)}
                      style={{ margin: 0 }}
                    >
                      <IonIcon icon={trashOutline} slot="start" style={{ fontSize: "16px" }} />
                      Delete
                    </IonButton>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>
      )}

      {/* Create Modal */}
      <IonModal
        isOpen={showCreateModal}
        onDidDismiss={() => setShowCreateModal(false)}
        breakpoints={[0, 1]}
        initialBreakpoint={1}
        handle={false}
        className="side-modal"
      >
        <IonHeader>
          <IonToolbar color="light">
            <IonTitle style={{ fontWeight: 600 }}>Create New Package</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowCreateModal(false)} fill="clear" color="medium">
                <IonIcon icon={closeOutline} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            {/* Section: Package Configuration */}
            <div style={{ marginBottom: "32px" }}>
              <h3 style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#000",
                marginBottom: "16px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                borderBottom: "2px solid #e0e0e0",
                paddingBottom: "8px"
              }}>
                Package Configuration
              </h3>

              <IonGrid style={{ padding: 0 }}>
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem lines="full" style={{ marginBottom: "12px", '--min-height': '56px' }}>
                      <IonLabel position="stacked" style={{ fontWeight: 500, marginBottom: "8px" }}>
                        Package Type <span style={{ color: "#d32f2f" }}>*</span>
                      </IonLabel>
                      <IonSelect

                        value={formData.packageType}
                        onIonChange={(e) => handleDurationChange(e.detail.value, formData.durationValue)}
                        interface="popover"
                        placeholder="Select type"
                      >
                        <IonSelectOption value="Hourly">Hourly</IonSelectOption>
                        <IonSelectOption value="Daily">Daily</IonSelectOption>
                        <IonSelectOption value="Weekly">Weekly</IonSelectOption>
                        <IonSelectOption value="Monthly">Monthly</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                  </IonCol>

                  <IonCol size="12" sizeMd="6">
                    <IonItem lines="full" style={{ marginBottom: "12px", '--min-height': '56px' }}>
                      <IonLabel position="stacked" style={{ fontWeight: 500, marginBottom: "8px" }}>
                        Duration Value <span style={{ color: "#d32f2f" }}>*</span>
                      </IonLabel>
                      <IonInput
                        type="number"

                        value={formData.durationValue}
                        onIonInput={(e) => handleDurationChange(formData.packageType, parseInt(e.detail.value || "1"))}
                        min={1}
                        placeholder="Enter duration"
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
              </IonGrid>
              <div style={{
                backgroundColor: "#f5f5f5",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "12px",
                border: "1px solid #e0e0e0"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", color: "#666", fontWeight: 500 }}>Total Hours:</span>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: "#000" }}>
                    {formData.totalHours} hrs
                  </span>
                </div>
              </div>
            </div>

            {/* Section: Package Details */}
            <div style={{ marginBottom: "32px" }}>
              <h3 style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#000",
                marginBottom: "16px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                borderBottom: "2px solid #e0e0e0",
                paddingBottom: "8px"
              }}>
                Package Details
              </h3>

              <IonItem lines="full" style={{ marginBottom: "12px" }}>
                <IonLabel position="stacked" style={{ fontWeight: 500, marginBottom: "8px" }}>
                  Package Name <span style={{ color: "#d32f2f" }}>*</span>
                </IonLabel>
                <IonInput
                  value={formData.name}
                  onIonInput={(e) => setFormData({ ...formData, name: e.detail.value || "" })}
                  placeholder="e.g., 1 Week Premium Package"
                />
              </IonItem>

              <IonItem lines="full" style={{ marginBottom: "12px" }}>
                <IonLabel position="stacked" style={{ fontWeight: 500, marginBottom: "8px" }}>
                  Price (₱) <span style={{ color: "#d32f2f" }}>*</span>
                </IonLabel>
                <IonInput
                  type="number"
                  value={formData.price}
                  onIonInput={(e) => setFormData({ ...formData, price: parseFloat(e.detail.value || "0") })}
                  min={0.01}
                  step="0.01"
                  placeholder="0.00"
                />
              </IonItem>

              <IonItem lines="full" style={{ marginBottom: "12px" }}>
                <IonLabel position="stacked" style={{ fontWeight: 500, marginBottom: "8px" }}>
                  Description
                </IonLabel>
                <IonTextarea
                  value={formData.description}
                  onIonInput={(e) => setFormData({ ...formData, description: e.detail.value || "" })}
                  placeholder="Add package description (optional)"
                  rows={3}
                  autoGrow={true}
                />
              </IonItem>

              <IonItem lines="none">
                <IonLabel position="stacked" style={{ fontWeight: 500, marginBottom: "8px" }}>
                  Display Order
                </IonLabel>
                <IonInput
                  type="number"
                  value={formData.displayOrder}
                  onIonInput={(e) => setFormData({ ...formData, displayOrder: parseInt(e.detail.value || "0") })}
                  placeholder="0"
                />
                <IonText slot="helper" color="medium" style={{ fontSize: "12px", marginTop: "4px" }}>
                  Lower numbers appear first in the list
                </IonText>
              </IonItem>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: "flex",
              gap: "12px",
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "1px solid #e0e0e0"
            }}>
              <IonButton
                expand="block"
                fill="clear"
                onClick={() => setShowCreateModal(false)}
                style={{ flex: 1 }}
                color="medium"
              >
                Cancel
              </IonButton>
              <IonButton
                expand="block"
                onClick={handleSaveCreate}
                disabled={createMutation.isPending}
                style={{ flex: 2 }}
                color="primary"
              >
                {createMutation.isPending ? "Creating..." : "Create Package"}
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal>

      {/* Edit Modal */}
      <IonModal
        isOpen={showEditModal}
        onDidDismiss={() => setShowEditModal(false)}
        breakpoints={[0, 1]}
        initialBreakpoint={1}
        handle={false}
        className="side-modal"
      >
        <IonHeader>
          <IonToolbar color="light">
            <IonTitle style={{ fontWeight: 600 }}>Edit Package</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowEditModal(false)} fill="clear" color="medium">
                <IonIcon icon={closeOutline} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            {/* Package Information */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{
                backgroundColor: "#f5f5f5",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
                marginBottom: "24px"
              }}>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Package Type</div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#000" }}>
                  {selectedPackage?.packageType} • {selectedPackage?.durationValue} {selectedPackage?.packageType === 'Hourly' ? 'Hour(s)' : selectedPackage?.packageType === 'Daily' ? 'Day(s)' : selectedPackage?.packageType === 'Weekly' ? 'Week(s)' : 'Month(s)'}
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  Total Hours: {selectedPackage?.totalHours} hrs
                </div>
              </div>
            </div>

            {/* Section: Package Details */}
            <div style={{ marginBottom: "32px" }}>
              <h3 style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#000",
                marginBottom: "16px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                borderBottom: "2px solid #e0e0e0",
                paddingBottom: "8px"
              }}>
                Package Details
              </h3>

              <IonItem lines="full" style={{ marginBottom: "12px" }}>
                <IonLabel position="stacked" style={{ fontWeight: 500, marginBottom: "8px" }}>
                  Package Name <span style={{ color: "#d32f2f" }}>*</span>
                </IonLabel>
                <IonInput
                  value={formData.name}
                  onIonInput={(e) => setFormData({ ...formData, name: e.detail.value || "" })}
                  placeholder="Package name"
                />
              </IonItem>

              <IonItem lines="full" style={{ marginBottom: "12px" }}>
                <IonLabel position="stacked" style={{ fontWeight: 500, marginBottom: "8px" }}>
                  Price (₱) <span style={{ color: "#d32f2f" }}>*</span>
                </IonLabel>
                <IonInput
                  type="number"
                  value={formData.price}
                  onIonInput={(e) => setFormData({ ...formData, price: parseFloat(e.detail.value || "0") })}
                  min={0.01}
                  step="0.01"
                  placeholder="0.00"
                />
              </IonItem>

              <IonItem lines="full" style={{ marginBottom: "12px" }}>
                <IonLabel position="stacked" style={{ fontWeight: 500, marginBottom: "8px" }}>
                  Description
                </IonLabel>
                <IonTextarea
                  value={formData.description}
                  onIonInput={(e) => setFormData({ ...formData, description: e.detail.value || "" })}
                  placeholder="Add package description (optional)"
                  rows={3}
                  autoGrow={true}
                />
              </IonItem>

              <IonItem lines="none">
                <IonLabel position="stacked" style={{ fontWeight: 500, marginBottom: "8px" }}>
                  Display Order
                </IonLabel>
                <IonInput
                  type="number"
                  value={formData.displayOrder}
                  onIonInput={(e) => setFormData({ ...formData, displayOrder: parseInt(e.detail.value || "0") })}
                  placeholder="0"
                />
                <IonText slot="helper" color="medium" style={{ fontSize: "12px", marginTop: "4px" }}>
                  Lower numbers appear first in the list
                </IonText>
              </IonItem>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: "flex",
              gap: "12px",
              marginTop: "32px",
              paddingTop: "24px",
              borderTop: "1px solid #e0e0e0"
            }}>
              <IonButton
                expand="block"
                fill="clear"
                onClick={() => setShowEditModal(false)}
                style={{ flex: 1 }}
                color="medium"
              >
                Cancel
              </IonButton>
              <IonButton
                expand="block"
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
                style={{ flex: 2 }}
                color="primary"
              >
                {updateMutation.isPending ? "Updating..." : "Update Package"}
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={3000}
        onDidDismiss={() => setShowToast(false)}
        color={toastColor}
      />

      <ConfirmToast
        isOpen={isConfirmOpen}
        {...confirmOptions}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onDidDismiss={handleDismiss}
      />
    </IonContent>
  );
};

export default SubscriptionPackageManagement;

