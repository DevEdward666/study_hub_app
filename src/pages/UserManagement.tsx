import React, { useState, useMemo } from "react";
import { useUsersManagement } from "../hooks/AdminDataHooks";
import { useConfirmation } from "../hooks/useConfirmation";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { ConfirmToast } from "../components/common/ConfirmToast";
import "../Admin/styles/admin.css";
import "../Admin/styles/admin-responsive.css";
import { useAdminStatus } from "@/hooks/AdminHooks";
import DynamicTable, { useTable } from "@/shared/DynamicTable/DynamicTable";
import { TableColumn } from "@/shared/DynamicTable/Interface/TableInterface";
import { 
  IonButton, 
  IonIcon, 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonSelect, 
  IonSelectOption, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle,
  IonToast
} from "@ionic/react";
import { 
  checkmarkCircleOutline, 
  closeCircleOutline, 
  arrowUpOutline, 
  arrowDownOutline, 
  addCircleOutline 
} from "ionicons/icons";

const UsersManagement: React.FC = () => {
  const { users, isLoading, error, toggleAdmin, addCredits, refetch } =
    useUsersManagement();
  const { refetch: refetchAdminStatus, isAdmin } = useAdminStatus();
  const [filterType, setFilterType] = useState<"all" | "admin" | "user">("all");
  
  // Add Credits Modal State
  const [isAddCreditsModalOpen, setIsAddCreditsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [creditAmount, setCreditAmount] = useState<number>(100);
  const [creditType, setCreditType] = useState<string>("basic");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("success");
  
  // Confirmation toast hooks
  const {
    isOpen: isConfirmOpen,
    options: confirmOptions,
    showConfirmation,
    handleConfirm: confirmAction,
    handleCancel: cancelAction,
    handleDismiss: dismissConfirm
  } = useConfirmation();
  
  const {
    tableState,
    updateState,
  } = useTable({
    queryKey: "users-table",
    fetchFn: async () => ({ 
      data: users, 
      total: users.length, 
      totalPages: 1,
      page: 1,
      pageSize: 10
    }),
    initialState: { pageSize: 10 },
  });

    const handleToggleAdmin = async (userId: string) => {
    const user = users?.find(u => u.id === userId);
    if (!user) return;
    
    const action = user.isAdmin ? "remove admin privileges from" : "grant admin privileges to";
    
    showConfirmation({
      header: user.isAdmin ? 'Remove Admin Rights' : 'Grant Admin Rights',
      message: `Are you sure you want to ${action} ${user.name} (${user.email})?\n\nThis will ${user.isAdmin ? "revoke" : "grant"} administrative access to the system.`,
      confirmText: user.isAdmin ? 'Remove Rights' : 'Grant Rights',
      cancelText: 'Cancel'
    }, async () => {
      await performToggleAdmin(userId);
    });
  };

  const performToggleAdmin = async (userId: string) => {
    try {
      await toggleAdmin.mutateAsync(userId);
      setToastMessage("Admin status updated successfully!");
      setToastColor("success");
      setShowToast(true);
    } catch (error) {
      console.error("Failed to toggle admin status:", error);
      setToastMessage("Failed to update admin status");
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const openAddCreditsModal = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setIsAddCreditsModalOpen(true);
  };

  const handleAddCredits = async () => {
    // Show confirmation toast
    showConfirmation({
      header: 'Add Credits',
      message: `Are you sure you want to add ${creditAmount} ${creditType} credits to ${selectedUserName}?\n\nThis action will immediately add credits to the user's account and cannot be undone.`,
      confirmText: 'Add Credits',
      cancelText: 'Cancel'
    }, async () => {
      await performAddCredits();
    });
  };

  const performAddCredits = async () => {
    try {
      const result = await addCredits.mutateAsync({
        userId: selectedUserId,
        amount: creditAmount,
        creditType: creditType
      });
      
      setToastMessage(`Successfully added ${creditAmount} ${creditType} credits to ${selectedUserName}`);
      setToastColor("success");
      setShowToast(true);
      setIsAddCreditsModalOpen(false);
      
      // Reset form
      setCreditAmount(100);
      setCreditType("basic");
      setSelectedUserId("");
      setSelectedUserName("");
      
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add credits";
      setToastMessage(message);
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const creditPackages = [
    { type: "basic", label: "Basic Credits", rates: [50, 100, 250, 500] },
    { type: "premium", label: "Premium Credits", rates: [25, 50, 100, 200] },
    { type: "bonus", label: "Bonus Credits", rates: [10, 25, 50, 100] }
  ];

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesFilter =
        filterType === "all" ||
        (filterType === "admin" && user.isAdmin) ||
        (filterType === "user" && !user.isAdmin);

      return matchesFilter;
    });
  }, [users, filterType]);

  const columns: TableColumn<any>[] = [
    { 
      key: "name", 
      label: "User", 
      sortable: true,
      render: (value) => value || "Unknown"
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
    },
    {
      key: "credits",
      label: "Credits",
      sortable: true,
    },
    {
      key: "isAdmin",
      label: "Role",
      sortable: true,
      render: (value) => (
        <span className={`status-badge ${value ? 'admin' : 'user'}`}>
          <span className="badge-icon">{value ? '⭐' : '👤'}</span>
          {value ? 'Admin' : 'User'}
        </span>
      ),
    },
    {
      key: "hasActiveSession",
      label: "Session",
      sortable: true,
      render: (value) => (
        <span className={`session-badge ${value ? 'active' : 'inactive'}`}>
          <span className={`session-dot ${value ? 'active' : 'inactive'}`}></span>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "id",
      label: "Actions",
      sortable: false,
      render: (value, row) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          <IonButton
            size="small"
            fill="clear"
            color="dark"
            onClick={() => handleToggleAdmin(value)}
            disabled={toggleAdmin.isPending}
            title={row.isAdmin ? "Remove Admin" : "Make Admin"}
          >
            <IonIcon 
              slot="icon-only" 
              icon={row.isAdmin ? arrowDownOutline : arrowUpOutline}
            />
          </IonButton>
          <IonButton
            size="small"
            fill="clear"
            color="primary"
            onClick={() => openAddCreditsModal(value, row.name || row.email)}
            disabled={addCredits.isPending}
            title="Add Credits"
          >
            <IonIcon slot="icon-only" icon={addCircleOutline} />
          </IonButton>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner message="Loading users..." />;
  }

  if (error) {
    console.log(error);
    return <ErrorMessage message="Failed to load users" onRetry={refetch} />;
  }

  return (
    <div className="users-management">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage users and admin permissions</p>
      </div>

      {/* Filter Buttons */}
      <div className="controls-section">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Users ({users.length})
          </button>
          <button
            className={`filter-btn ${filterType === "admin" ? "active" : ""}`}
            onClick={() => setFilterType("admin")}
          >
            Admins ({users.filter((u) => u.isAdmin).length})
          </button>
          <button
            className={`filter-btn ${filterType === "user" ? "active" : ""}`}
            onClick={() => setFilterType("user")}
          >
            Users ({users.filter((u) => !u.isAdmin).length})
          </button>
        </div>
      </div>

      {/* Users Table with DynamicTable */}
      <DynamicTable
        columns={columns}
        data={filteredUsers}
        isLoading={isLoading}
        isError={!!error}
        error={error}
        onRefetch={refetch}
        tableState={tableState}
        onStateChange={updateState}
        searchPlaceholder="Search users by name or email..."
        emptyMessage="No users found"
        loadingMessage="Loading users..."
      />

      {/* Add Credits Modal */}
      <IonModal
        isOpen={isAddCreditsModalOpen}
        onDidDismiss={() => setIsAddCreditsModalOpen(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Add Credits</IonTitle>
            <IonButton
              slot="end"
              fill="clear"
              onClick={() => setIsAddCreditsModalOpen(false)}
            >
              Close
            </IonButton>
          </IonToolbar>
        </IonHeader>

        <IonContent className="add-credits-modal-content">
          <div className="add-credits-form">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Add Credits to {selectedUserName}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="form-section">
                  <IonItem>
                    <IonLabel position="stacked">Credit Type</IonLabel>
                    <IonSelect
                      value={creditType}
                      placeholder="Select credit type"
                      onIonChange={(e) => setCreditType(e.detail.value)}
                    >
                      {creditPackages.map((pkg) => (
                        <IonSelectOption key={pkg.type} value={pkg.type}>
                          {pkg.label}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </div>

                <div className="form-section">
                  <h3>Quick Select</h3>
                  <div className="package-options">
                    {creditPackages
                      .find((pkg) => pkg.type === creditType)
                      ?.rates.map((rate) => (
                        <div
                          key={rate}
                          className={`package-option ${creditAmount === rate ? "selected" : ""}`}
                          onClick={() => setCreditAmount(rate)}
                          style={{
                            padding: "12px",
                            margin: "8px",
                            border: creditAmount === rate ? "2px solid #3880ff" : "2px solid #e0e0e0",
                            borderRadius: "8px",
                            cursor: "pointer",
                            textAlign: "center",
                            backgroundColor: creditAmount === rate ? "#f0f8ff" : "#fff"
                          }}
                        >
                          <h4 style={{ margin: "0 0 4px 0" }}>{rate} Credits</h4>
                          <p style={{ margin: "0", fontSize: "0.9em", color: "#666" }}>
                            {creditType.charAt(0).toUpperCase() + creditType.slice(1)}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="form-section">
                  <IonItem>
                    <IonLabel position="stacked">Custom Amount</IonLabel>
                    <IonInput
                      type="number"
                      value={creditAmount}
                      placeholder="Enter amount"
                      onIonInput={(e) =>
                        setCreditAmount(parseInt(e.detail.value!, 10) || 0)
                      }
                      min="1"
                      max="10000"
                    />
                  </IonItem>
                </div>

                <div className="add-credits-summary" style={{
                  marginTop: "20px",
                  padding: "16px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "8px"
                }}>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}>
                    <span><strong>User:</strong></span>
                    <span>{selectedUserName}</span>
                  </div>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}>
                    <span><strong>Credit Type:</strong></span>
                    <span>{creditType.charAt(0).toUpperCase() + creditType.slice(1)}</span>
                  </div>
                  <div className="summary-row total" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                    fontSize: "1.1em"
                  }}>
                    <span>Credits to Add:</span>
                    <span>{creditAmount}</span>
                  </div>
                </div>

                <IonButton
                  expand="block"
                  onClick={handleAddCredits}
                  disabled={addCredits.isPending || creditAmount < 1}
                  style={{ marginTop: "20px" }}
                >
                  {addCredits.isPending
                    ? "Adding Credits..."
                    : "Add Credits"}
                </IonButton>

                <div className="add-credits-note" style={{
                  marginTop: "16px",
                  textAlign: "center"
                }}>
                  <p>
                    <small>
                      Note: Credits will be added immediately to the user's account.
                    </small>
                  </p>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonModal>

      {/* Toast for notifications */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastColor}
      />

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
  );
};
export default UsersManagement;
