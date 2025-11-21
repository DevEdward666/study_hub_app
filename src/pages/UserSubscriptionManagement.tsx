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
  IonFooter,
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
  checkmarkCircleOutline,
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
import SlideoutModal from "@/shared/SideOutModal/SideoutModalComponent";
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

  // Search modal states
  const [showCustomerSearchModal, setShowCustomerSearchModal] = useState(false);
  const [showPackageSearchModal, setShowPackageSearchModal] = useState(false);
  const [showPaymentSearchModal, setShowPaymentSearchModal] = useState(false);
  const [showTableSearchModal, setShowTableSearchModal] = useState(false);

  // Search text states
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [packageSearchText, setPackageSearchText] = useState("");
  const [paymentSearchText, setPaymentSearchText] = useState("");
  const [tableSearchText, setTableSearchText] = useState("");

  // WiFi password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [wifiPassword, setWifiPassword] = useState("password1234");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [printReceiptMutation, setPrintReceiptMutation] = useState({ isPending: false });

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

    // Validate cash for Cash payment method
    const selectedPkg = packages?.find((p) => p.id === formData.packageId);
    if (formData.paymentMethod === "Cash") {
      if ((formData.cash || 0) < (selectedPkg?.price || 0)) {
        setToastMessage("❌ Insufficient cash amount. Cash must be at least ₱" + selectedPkg?.price.toFixed(2));
        setToastColor("danger");
        setShowToast(true);
        return;
      }
    }

    try {
      const result = await purchaseMutation.mutateAsync(formData);
      setToastMessage("✅ Subscription purchased successfully!");
      setToastColor("success");
      setShowToast(true);
      setShowPurchaseModal(false);
      
      // Show WiFi password modal for receipt printing
      if (result && result.id) {
        setSelectedSessionId(result.id);
        setShowPasswordModal(true);
      }
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
      setToastMessage("❌ Insufficient cash amount. Cash must be at least ₱" + selectedPkg?.price.toFixed(2));
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

      // Show WiFi password modal for receipt printing
      if (subscription && subscription.id) {
        setSelectedSessionId(subscription.id);
        setShowPasswordModal(true);
      }
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

  // Filtered data for search modals
  const filteredCustomers = users?.filter((user) =>
    user.role?.toLowerCase() === 'customer' &&
    (!customerSearchText ||
      user.name?.toLowerCase().includes(customerSearchText.toLowerCase()) ||
      user.email?.toLowerCase().includes(customerSearchText.toLowerCase()))
  ) || [];

  const filteredPackages = packages?.filter((pkg) =>
    !packageSearchText ||
    pkg.name?.toLowerCase().includes(packageSearchText.toLowerCase()) ||
    pkg.price?.toString().includes(packageSearchText)
  ) || [];

  const paymentMethods = [
    { value: "Cash", label: "Cash" },
    { value: "GCash", label: "GCash" },
    { value: "Card", label: "Card" },
    { value: "Bank Transfer", label: "Bank Transfer" }
  ];

  const filteredPaymentMethods = paymentMethods.filter((method) =>
    !paymentSearchText ||
    method.label.toLowerCase().includes(paymentSearchText.toLowerCase())
  );

  const filteredAvailableTables = availableTables.filter((table: any) =>
    !tableSearchText ||
    table.tableNumber?.toString().includes(tableSearchText) ||
    table.capacity?.toString().includes(tableSearchText)
  );

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

  const handleConfirmPrint = async () => {
    if (!wifiPassword) {
      setToastMessage("❌ WiFi password is required");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    setPrintReceiptMutation({ isPending: true });

    try {
      // Here you would call your print receipt API
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setToastMessage("✅ Receipt printed successfully!");
      setToastColor("success");
      setShowToast(true);
      setShowPasswordModal(false);
      setWifiPassword("password1234");
      setSelectedSessionId("");
      
      // Refresh subscriptions
      await refetchSubs();
    } catch (error: any) {
      setToastMessage(`❌ Failed to print receipt: ${error.message}`);
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setPrintReceiptMutation({ isPending: false });
    }
  };

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
            <IonItem button onClick={() => setShowCustomerSearchModal(true)} detail>
              <IonLabel position="stacked">Customer *</IonLabel>
              <IonLabel color={formData.userId ? "dark" : "medium"}>
                {formData.userId
                  ? (users?.find(u => u.id === formData.userId)?.name ||
                    users?.find(u => u.id === formData.userId)?.email)
                  : "Select customer"}
              </IonLabel>
            </IonItem>

            <IonItem button onClick={() => setShowPackageSearchModal(true)} detail>
              <IonLabel position="stacked">Package *</IonLabel>
              <IonLabel color={formData.packageId ? "dark" : "medium"}>
                {formData.packageId
                  ? `${packages?.find(p => p.id === formData.packageId)?.name} - ₱${packages?.find(p => p.id === formData.packageId)?.price.toFixed(2)}`
                  : "Select package"}
              </IonLabel>
            </IonItem>

            <IonItem button onClick={() => setShowPaymentSearchModal(true)} detail>
              <IonLabel position="stacked">Payment Method *</IonLabel>
              <IonLabel color="dark">{formData.paymentMethod}</IonLabel>
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

                <IonItem button onClick={() => setShowTableSearchModal(true)} detail>
                  <IonLabel position="stacked">Select Table *</IonLabel>
                  <IonLabel color={selectedTableId ? "dark" : "medium"}>
                    {selectedTableId
                      ? `Table ${availableTables.find((t: any) => t.id === selectedTableId)?.tableNumber} - ${availableTables.find((t: any) => t.id === selectedTableId)?.capacity} seats`
                      : "Choose a table"}
                  </IonLabel>
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

        {/* Customer Search Modal */}
        <IonModal
          isOpen={showCustomerSearchModal}
          onDidDismiss={() => {
            setShowCustomerSearchModal(false);
            setCustomerSearchText("");
          }}
          breakpoints={[0, 1]}
          initialBreakpoint={1}
          handle={false}
          className="side-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Select Customer</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => {
                  setShowCustomerSearchModal(false);
                  setCustomerSearchText("");
                }}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonSearchbar
              value={customerSearchText}
              onIonInput={(e) => setCustomerSearchText(e.detail.value || "")}
              placeholder="Search customers by name or email..."
              style={{ marginBottom: "16px" }}
            />
            <IonList>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((user) => (
                  <IonItem
                    key={user.id}
                    button
                    onClick={() => {
                      setFormData({ ...formData, userId: user.id });
                      setShowCustomerSearchModal(false);
                      setCustomerSearchText("");
                    }}
                    detail={false}
                    style={{
                      background: formData.userId === user.id ? "var(--ion-color-light)" : "transparent"
                    }}
                  >
                    <IonIcon icon={personOutline} slot="start" color="primary" />
                    <IonLabel>
                      <h3>{user.name || user.email}</h3>
                      {user.name && <p>{user.email}</p>}
                    </IonLabel>
                    {formData.userId === user.id && (
                      <IonIcon icon={checkmarkCircleOutline} slot="end" color="success" />
                    )}
                  </IonItem>
                ))
              ) : (
                <IonItem>
                  <IonLabel color="medium">
                    <p style={{ textAlign: "center", padding: "20px" }}>
                      No customers found
                    </p>
                  </IonLabel>
                </IonItem>
              )}
            </IonList>
          </IonContent>
        </IonModal>

        {/* Package Search Modal */}
        <IonModal
          isOpen={showPackageSearchModal}
          onDidDismiss={() => {
            setShowPackageSearchModal(false);
            setPackageSearchText("");
          }}
          breakpoints={[0, 1]}
          initialBreakpoint={1}
          handle={false}
          className="side-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Select Package</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => {
                  setShowPackageSearchModal(false);
                  setPackageSearchText("");
                }}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonSearchbar
              value={packageSearchText}
              onIonInput={(e) => setPackageSearchText(e.detail.value || "")}
              placeholder="Search packages by name or price..."
              style={{ marginBottom: "16px" }}
            />
            <IonList>
              {filteredPackages.length > 0 ? (
                filteredPackages.map((pkg) => (
                  <IonItem
                    key={pkg.id}
                    button
                    onClick={() => {
                      setFormData({
                        ...formData,
                        packageId: pkg.id,
                        cash: pkg.price || 0,
                      });
                      setShowPackageSearchModal(false);
                      setPackageSearchText("");
                    }}
                    detail={false}
                    style={{
                      background: formData.packageId === pkg.id ? "var(--ion-color-light)" : "transparent"
                    }}
                  >
                    <IonIcon icon={cardOutline} slot="start" color="success" />
                    <IonLabel>
                      <h3>{pkg.name}</h3>
                      <p>₱{pkg.price.toFixed(2)} • {pkg.durationValue} {pkg.packageType}</p>
                    </IonLabel>
                    {formData.packageId === pkg.id && (
                      <IonIcon icon={checkmarkCircleOutline} slot="end" color="success" />
                    )}
                  </IonItem>
                ))
              ) : (
                <IonItem>
                  <IonLabel color="medium">
                    <p style={{ textAlign: "center", padding: "20px" }}>
                      No packages found
                    </p>
                  </IonLabel>
                </IonItem>
              )}
            </IonList>
          </IonContent>
        </IonModal>

        {/* Payment Method Search Modal */}
        <IonModal
          isOpen={showPaymentSearchModal}
          onDidDismiss={() => {
            setShowPaymentSearchModal(false);
            setPaymentSearchText("");
          }}
          breakpoints={[0, 1]}
          initialBreakpoint={1}
          handle={false}
          className="side-modal"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Select Payment Method</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => {
                  setShowPaymentSearchModal(false);
                  setPaymentSearchText("");
                }}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonSearchbar
              value={paymentSearchText}
              onIonInput={(e) => setPaymentSearchText(e.detail.value || "")}
              placeholder="Search payment methods..."
              style={{ marginBottom: "16px" }}
            />
            <IonList>
              {filteredPaymentMethods.length > 0 ? (
                filteredPaymentMethods.map((method) => (
                  <IonItem
                    key={method.value}
                    button
                    onClick={() => {
                      setFormData({ ...formData, paymentMethod: method.value });
                      setShowPaymentSearchModal(false);
                      setPaymentSearchText("");
                    }}
                    detail={false}
                    style={{
                      background: formData.paymentMethod === method.value ? "var(--ion-color-light)" : "transparent"
                    }}
                  >
                    <IonIcon icon={cardOutline} slot="start" color="tertiary" />
                    <IonLabel>
                      <h3>{method.label}</h3>
                    </IonLabel>
                    {formData.paymentMethod === method.value && (
                      <IonIcon icon={checkmarkCircleOutline} slot="end" color="success" />
                    )}
                  </IonItem>
                ))
              ) : (
                <IonItem>
                  <IonLabel color="medium">
                    <p style={{ textAlign: "center", padding: "20px" }}>
                      No payment methods found
                    </p>
                  </IonLabel>
                </IonItem>
              )}
            </IonList>
          </IonContent>
        </IonModal>

        {/* Table Search Modal */}
        <IonModal
          isOpen={showTableSearchModal}
          onDidDismiss={() => {
            setShowTableSearchModal(false);
            setTableSearchText("");
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
                  setShowTableSearchModal(false);
                  setTableSearchText("");
                }}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonSearchbar
              value={tableSearchText}
              onIonInput={(e) => setTableSearchText(e.detail.value || "")}
              placeholder="Search tables by number or capacity..."
              style={{ marginBottom: "16px" }}
            />
            <IonList>
              {filteredAvailableTables.length > 0 ? (
                filteredAvailableTables.map((table: any) => (
                  <IonItem
                    key={table.id}
                    button
                    onClick={() => {
                      setSelectedTableId(table.id);
                      setShowTableSearchModal(false);
                      setTableSearchText("");
                    }}
                    detail={false}
                    style={{
                      background: selectedTableId === table.id ? "var(--ion-color-light)" : "transparent"
                    }}
                  >
                    <IonIcon icon={desktopOutline} slot="start" color="primary" />
                    <IonLabel>
                      <h3>Table {table.tableNumber}</h3>
                      <p>Capacity: {table.capacity} seats</p>
                    </IonLabel>
                    {selectedTableId === table.id && (
                      <IonIcon icon={checkmarkCircleOutline} slot="end" color="success" />
                    )}
                  </IonItem>
                ))
              ) : (
                <IonItem>
                  <IonLabel color="medium">
                    <p style={{ textAlign: "center", padding: "20px" }}>
                      {availableTables.length === 0 ? "No tables available" : "No tables found"}
                    </p>
                  </IonLabel>
                </IonItem>
              )}
            </IonList>
          </IonContent>
        </IonModal>

        {/* WiFi Password Modal for Receipt Printing */}
        <SlideoutModal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setWifiPassword("password1234");
            setSelectedSessionId("");
          }}
          title="Print Receipt - WiFi Password"
          position="end"
          size="small"
        >
          <div style={{ padding: "20px" }}>
            <p style={{ marginBottom: "20px", color: "#666" }}>
              Enter the WiFi password to be printed on the receipt as a QR code.
            </p>

            <IonItem style={{ marginBottom: "20px" }}>
              <IonLabel position="stacked">WiFi Password *</IonLabel>
              <IonInput
                type="text"
                value={wifiPassword}
                placeholder="Enter WiFi password"
                onIonInput={(e) => setWifiPassword(e.detail.value || "")}
              />
            </IonItem>

            <div style={{
              padding: "15px",
              background: "#f0f9ff",
              borderRadius: "8px",
              border: "1px solid #0ea5e9"
            }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#0369a1" }}>
                <strong>📱 QR Code Preview:</strong>
              </p>
              <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "#0c4a6e" }}>
                Password: <strong>{wifiPassword || "(empty)"}</strong>
              </p>
              <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                This will be printed as a scannable QR code on the receipt.
              </p>
            </div>
          </div>

          <IonFooter className="ion-no-border">
            <IonToolbar>
              <IonButtons slot="end" className="modal-action-buttons">
                <IonButton
                  onClick={() => {
                    setShowPasswordModal(false);
                    setWifiPassword("password1234");
                    setSelectedSessionId("");
                  }}
                >
                  Cancel
                </IonButton>
                <IonButton
                  onClick={handleConfirmPrint}
                  disabled={!wifiPassword || printReceiptMutation.isPending}
                  color="primary"
                  fill="solid"
                >
                  {printReceiptMutation.isPending ? "Printing..." : "Print Receipt"}
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonFooter>
        </SlideoutModal>

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

