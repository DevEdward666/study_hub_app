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
  IonTextarea,
  IonSearchbar,
} from "@ionic/react";
import {
  addOutline,
  closeOutline,
  cardOutline,
  personOutline,
  timeOutline,
  statsChartOutline,
  playOutline,
  desktopOutline,
} from "ionicons/icons";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import {
  useAllUserSubscriptions,
  useSubscriptionPackages,
  useAdminPurchaseSubscription,
} from "../hooks/SubscriptionHooks";
import { useUsersManagement, useTablesManagement } from "../hooks/AdminDataHooks";
import { AdminPurchaseSubscription } from "../schema/subscription.schema";
import { tableService } from "../services/table.service";
import "../Admin/styles/admin.css";
import "../styles/side-modal.css";

const UserSubscriptionManagement: React.FC = () => {
  const { data: subscriptions, isLoading, refetch: refetchSubs } = useAllUserSubscriptions();
  const { data: packages } = useSubscriptionPackages(true);
  const { users } = useUsersManagement();
  const { tables, refetch: refetchTables } = useTablesManagement();
  const purchaseMutation = useAdminPurchaseSubscription();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showTableSelectionModal, setShowTableSelectionModal] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pendingSubscriptionId, setPendingSubscriptionId] = useState("");

  const [formData, setFormData] = useState<AdminPurchaseSubscription>({
    userId: "",
    packageId: "",
    paymentMethod: "Cash",
    cash: 0,
    change: 0,
    notes: "",
  });

  const handlePurchase = () => {
    setFormData({
      userId: "",
      packageId: "",
      paymentMethod: "Cash",
      cash: 0,
      change: 0,
      notes: "",
    });
    setShowPurchaseModal(true);
  };

  const handleSavePurchase = async () => {
    if (!formData.userId || !formData.packageId) {
      setToastMessage("❌ User and package are required");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    try {
      await purchaseMutation.mutateAsync(formData);
      setToastMessage("✅ Subscription purchased successfully!");
      setToastColor("success");
      setShowToast(true);
      setShowPurchaseModal(false);
    } catch (error: any) {
      setToastMessage(`❌ Failed to purchase subscription: ${error.message}`);
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const handleCreateAndStartSession = () => {
    if (!formData.userId || !formData.packageId) {
      setToastMessage("❌ User and package are required");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    // Validate cash for Cash payment method
    const selectedPkg = packages?.find((p) => p.id === formData.packageId);
    if (formData.paymentMethod === "Cash" && (formData.cash || 0) < (selectedPkg?.price || 0)) {
      setToastMessage("❌ Insufficient cash amount");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    // Open table selection modal
    setShowTableSelectionModal(true);
  };

  const handleConfirmTableSelection = async () => {
    if (!selectedTableId) {
      setToastMessage("❌ Please select a table");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    try {
      // First create the subscription purchase
      const subscription = await purchaseMutation.mutateAsync(formData);
      
      // Store subscription ID for starting session
      setPendingSubscriptionId(subscription.id);

      // Start the session with the new subscription
      await tableService.startSubscriptionSession(
        selectedTableId,
        subscription.id,
        formData.userId
      );

      setToastMessage("✅ Transaction created & session started!");
      setToastColor("success");
      setShowToast(true);
      
      // Close both modals
      setShowPurchaseModal(false);
      setShowTableSelectionModal(false);
      setSelectedTableId("");
      setPendingSubscriptionId("");

      // Refresh data
      await refetchSubs();
      await refetchTables();
    } catch (error: any) {
      setToastMessage(`❌ Failed: ${error.message}`);
      setToastColor("danger");
      setShowToast(true);
    }
  };

  // Get available tables
  const availableTables = tables?.filter(t => 
    !t.currentSession || 
    (t.currentSession && !(t.currentSession as any).id)
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "expired":
        return "danger";
      case "cancelled":
        return "warning";
      default:
        return "medium";
    }
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions?.filter((sub) => {
    const matchesStatus = statusFilter === "All" || sub.status === statusFilter;
    const matchesSearch =
      !searchText ||
      sub.user?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      sub.user?.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      sub.packageName?.toLowerCase().includes(searchText.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading subscriptions..." />;
  }

  return (
    <IonContent>
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ color: "var(--ion-color-primary)", display: "flex", alignItems: "center", gap: "12px" }}>
            <IonIcon icon={personOutline} />
            Create New Transaction
          </h1>
          <p style={{ color: "#666", marginTop: "8px" }}>Manage user subscriptions and track usage</p>
        </div>

        {/* Actions */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <IonButton onClick={handlePurchase} color="success">
            <IonIcon icon={addOutline} slot="start" />
            Create Transaction
          </IonButton>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value || "")}
            placeholder="Search by user or package..."
            style={{ flex: 1, minWidth: "250px" }}
          />
          <IonSelect
            value={statusFilter}
            onIonChange={(e) => setStatusFilter(e.detail.value)}
            placeholder="Filter by status"
            style={{ minWidth: "150px" }}
          >
            <IonSelectOption value="All">All Status</IonSelectOption>
            <IonSelectOption value="Active">Active</IonSelectOption>
            <IonSelectOption value="Expired">Expired</IonSelectOption>
            <IonSelectOption value="Cancelled">Cancelled</IonSelectOption>
          </IonSelect>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
          <IonCard>
            <IonCardContent style={{ textAlign: "center", padding: "16px" }}>
              <IonIcon icon={statsChartOutline} style={{ fontSize: "32px", color: "var(--ion-color-success)" }} />
              <h3 style={{ margin: "8px 0 4px", fontSize: "24px", fontWeight: "bold" }}>
                {subscriptions?.filter((s) => s.status === "Active").length || 0}
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Active Subscriptions</p>
            </IonCardContent>
          </IonCard>
          <IonCard>
            <IonCardContent style={{ textAlign: "center", padding: "16px" }}>
              <IonIcon icon={timeOutline} style={{ fontSize: "32px", color: "var(--ion-color-primary)" }} />
              <h3 style={{ margin: "8px 0 4px", fontSize: "24px", fontWeight: "bold" }}>
                {subscriptions?.reduce((sum, s) => sum + s.remainingHours, 0).toFixed(0) || 0}
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Total Remaining Hours</p>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Subscriptions List */}
        {!filteredSubscriptions || filteredSubscriptions.length === 0 ? (
          <IonCard>
            <IonCardContent style={{ textAlign: "center", padding: "40px" }}>
              <IonIcon icon={cardOutline} style={{ fontSize: "64px", color: "#ccc", marginBottom: "16px" }} />
              <IonText color="medium">
                <p>No subscriptions found.</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        ) : (
          <IonList>
            {filteredSubscriptions.map((sub) => (
              <IonCard key={sub.id} style={{ marginBottom: "12px" }}>
                <IonCardContent>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                    <div style={{ flex: 1, minWidth: "250px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <IonIcon icon={personOutline} style={{ fontSize: "20px", color: "var(--ion-color-primary)" }} />
                        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
                          {sub.user?.name || sub.user?.email}
                        </h3>
                        <IonBadge color={getStatusColor(sub.status)}>{sub.status}</IonBadge>
                      </div>
                      <div style={{ marginLeft: "28px" }}>
                        <p style={{ margin: "4px 0", fontSize: "16px", fontWeight: "600", color: "var(--ion-color-success)" }}>
                          {sub.packageName}
                        </p>
                        <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
                          ₱{sub.purchaseAmount.toFixed(2)} • {sub.paymentMethod}
                        </p>
                        <p style={{ margin: "4px 0", fontSize: "12px", color: "#999" }}>
                          Purchased: {new Date(sub.purchaseDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div style={{ minWidth: "200px" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                          <span>Hours Used:</span>
                          <span>
                            <strong>{sub.hoursUsed.toFixed(1)}</strong> / {sub.totalHours.toFixed(0)}
                          </span>
                        </div>
                        <IonProgressBar value={sub.percentageUsed / 100} color={sub.percentageUsed > 80 ? "danger" : "success"} />
                        <div style={{ fontSize: "10px", color: "#666", marginTop: "2px", textAlign: "right" }}>
                          {sub.percentageUsed.toFixed(1)}% used
                        </div>
                      </div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        <div>Remaining: <strong style={{ color: "var(--ion-color-success)" }}>{sub.remainingHours.toFixed(1)} hours</strong></div>
                      </div>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>
        )}

        {/* Purchase Modal */}
        <IonModal
          isOpen={showPurchaseModal}
          onDidDismiss={() => setShowPurchaseModal(false)}
          breakpoints={[0, 1]}
          initialBreakpoint={1}
          handle={false}
          className="side-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Create New Transaction</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowPurchaseModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Customer *</IonLabel>
              <IonSelect
                value={formData.userId}
                onIonChange={(e) => setFormData({ ...formData, userId: e.detail.value })}
                placeholder="Select customer"
              >
                {users?.filter((user) => user.role?.toLowerCase() === 'customer').map((user) => (
                  <IonSelectOption key={user.id} value={user.id}>
                    {user.name || user.email}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Package *</IonLabel>
              <IonSelect
                value={formData.packageId}
                onIonChange={(e) => {
                  const selectedPkg = packages?.find((p) => p.id === e.detail.value);
                  setFormData({
                    ...formData,
                    packageId: e.detail.value,
                    cash: selectedPkg?.price || 0,
                  });
                }}
                placeholder="Select package"
              >
                {packages?.map((pkg) => (
                  <IonSelectOption key={pkg.id} value={pkg.id}>
                    {pkg.name} - ₱{pkg.price.toFixed(2)}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Payment Method *</IonLabel>
              <IonSelect
                value={formData.paymentMethod}
                onIonChange={(e) => setFormData({ ...formData, paymentMethod: e.detail.value })}
              >
                <IonSelectOption value="Cash">Cash</IonSelectOption>
                <IonSelectOption value="GCash">GCash</IonSelectOption>
                <IonSelectOption value="Card">Card</IonSelectOption>
                <IonSelectOption value="Bank Transfer">Bank Transfer</IonSelectOption>
              </IonSelect>
            </IonItem>
            {formData.paymentMethod === "Cash" && (
              <>
                <IonItem>
                  <IonLabel position="stacked">Cash Amount (₱)</IonLabel>
                  <IonInput
                    type="number"
                    value={formData.cash}
                    onIonInput={(e) => {
                      const cash = parseFloat(e.detail.value || "0");
                      const selectedPkg = packages?.find((p) => p.id === formData.packageId);
                      const change = cash - (selectedPkg?.price || 0);
                      setFormData({ ...formData, cash, change: change > 0 ? change : 0 });
                    }}
                    step="0.01"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel>Change: ₱{(formData.change || 0).toFixed(2)}</IonLabel>
                </IonItem>
              </>
            )}
            <IonItem>
              <IonLabel position="stacked">Notes</IonLabel>
              <IonTextarea
                value={formData.notes}
                onIonInput={(e) => setFormData({ ...formData, notes: e.detail.value || "" })}
                placeholder="Optional notes"
                rows={3}
              />
            </IonItem>
            <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
              <IonButton 
                expand="block" 
                onClick={handleSavePurchase} 
                disabled={purchaseMutation.isPending}
                color="primary"
                style={{ flex: 1 }}
              >
                {purchaseMutation.isPending ? "Processing..." : "Create Transaction"}
              </IonButton>
              <IonButton 
                expand="block" 
                onClick={handleCreateAndStartSession} 
                disabled={purchaseMutation.isPending}
                color="secondary"
                style={{ flex: 1 }}
              >
                <IonIcon icon={playOutline} slot="start" />
                Create & Start Session
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Table Selection Modal */}
        <IonModal
          isOpen={showTableSelectionModal}
          onDidDismiss={() => {
            setShowTableSelectionModal(false);
            setSelectedTableId("");
          }}
          breakpoints={[0, 1]}
          initialBreakpoint={1}
          handle={false}
          className="side-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Select Table</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => {
                  setShowTableSelectionModal(false);
                  setSelectedTableId("");
                }}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {formData.userId && formData.packageId && (
              <>
                <div style={{ marginBottom: "24px", padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
                  <h3 style={{ margin: "0 0 8px 0" }}>
                    {users?.find(u => u.id === formData.userId)?.name || 
                     users?.find(u => u.id === formData.userId)?.email}
                  </h3>
                  <p style={{ margin: "4px 0", fontSize: "14px" }}>
                    📦 {packages?.find(p => p.id === formData.packageId)?.name}
                  </p>
                  <p style={{ margin: "4px 0", fontSize: "14px", fontWeight: "bold", color: "var(--ion-color-success)" }}>
                    💰 ₱{packages?.find(p => p.id === formData.packageId)?.price.toFixed(2)}
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
                        <IonIcon icon={desktopOutline} /> Table {table.tableNumber} - {table.capacity} seats
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
                    onClick={handleConfirmTableSelection}
                    disabled={!selectedTableId || availableTables.length === 0 || purchaseMutation.isPending}
                  >
                    <IonIcon icon={playOutline} slot="start" />
                    {purchaseMutation.isPending ? "Starting..." : "Confirm & Start Session"}
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

export default UserSubscriptionManagement;

