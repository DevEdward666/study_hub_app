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
import { RegisterRequestSchema } from "@/schema/auth.schema";
import { z } from "zod";
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
  IonToast,
  IonText
} from "@ionic/react";
import { 
  checkmarkCircleOutline, 
  closeCircleOutline, 
  arrowUpOutline, 
  arrowDownOutline, 
  addCircleOutline,
  personAddOutline
} from "ionicons/icons";

const UsersManagement: React.FC = () => {
  const { users, isLoading, error, toggleAdmin, addCredits, createUser, refetch } =
    useUsersManagement();
  const { refetch: refetchAdminStatus, isAdmin } = useAdminStatus();
  const [filterType, setFilterType] = useState<"all" | "admin" | "user">("all");
  
  // Add Credits Modal State
  const [isAddCreditsModalOpen, setIsAddCreditsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [creditAmount, setCreditAmount] = useState<number>(100);
  const [creditType, setCreditType] = useState<string>("basic");
  
  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [userFormErrors, setUserFormErrors] = useState<{[key: string]: string}>({});
  
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

  // User Creation Functions
  const validateUserForm = (): boolean => {
    try {
      RegisterRequestSchema.parse({
        name: newUserData.name,
        email: newUserData.email,
        password: newUserData.password
      });
      
      // Additional password confirmation check
      if (newUserData.password !== newUserData.confirmPassword) {
        setUserFormErrors({ confirmPassword: 'Passwords do not match' });
        return false;
      }
      
      setUserFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: {[key: string]: string} = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setUserFormErrors(newErrors);
      }
      return false;
    }
  };

  const handleCreateUser = async () => {
    if (!validateUserForm()) {
      return;
    }

    showConfirmation({
      header: 'Create New User',
      message: `Are you sure you want to create a new user account?\n\nName: ${newUserData.name}\nEmail: ${newUserData.email}\n\nThe user will be able to log in immediately with the provided credentials.`,
      confirmText: 'Create User',
      cancelText: 'Cancel'
    }, async () => {
      await performCreateUser();
    });
  };

  const performCreateUser = async () => {
    try {
      await createUser.mutateAsync({
        name: newUserData.name,
        email: newUserData.email,
        password: newUserData.password
      });
      
      setToastMessage(`Successfully created user: ${newUserData.name}`);
      setToastColor("success");
      setShowToast(true);
      setIsAddUserModalOpen(false);
      
      // Reset form
      setNewUserData({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
      });
      setUserFormErrors({});
      
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create user";
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
        <div className="header-actions">
          <IonButton
            color="primary"
            onClick={() => setIsAddUserModalOpen(true)}
          >
            <IonIcon icon={personAddOutline} slot="start" />
            Add New User
          </IonButton>
        </div>
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

      {/* Create User Modal */}
      <IonModal
        isOpen={isAddUserModalOpen}
        onDidDismiss={() => setIsAddUserModalOpen(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Create New User</IonTitle>
            <IonButton
              slot="end"
              fill="clear"
              onClick={() => setIsAddUserModalOpen(false)}
            >
              Close
            </IonButton>
          </IonToolbar>
        </IonHeader>

        <IonContent className="create-user-modal-content">
          <div className="create-user-form">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>User Details</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="form-section">
                  <IonItem className={userFormErrors.name ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">Full Name *</IonLabel>
                    <IonInput
                      type="text"
                      value={newUserData.name}
                      placeholder="Enter full name"
                      onIonInput={(e) => setNewUserData({...newUserData, name: e.detail.value!})}
                      required
                    />
                  </IonItem>
                  {userFormErrors.name && (
                    <IonText color="danger" className="error-text">
                      {userFormErrors.name}
                    </IonText>
                  )}
                </div>

                <div className="form-section">
                  <IonItem className={userFormErrors.email ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">Email Address *</IonLabel>
                    <IonInput
                      type="email"
                      value={newUserData.email}
                      placeholder="Enter email address"
                      onIonInput={(e) => setNewUserData({...newUserData, email: e.detail.value!})}
                      required
                    />
                  </IonItem>
                  {userFormErrors.email && (
                    <IonText color="danger" className="error-text">
                      {userFormErrors.email}
                    </IonText>
                  )}
                </div>

                <div className="form-section">
                  <IonItem className={userFormErrors.password ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">Password *</IonLabel>
                    <IonInput
                      type="password"
                      value={newUserData.password}
                      placeholder="Create a password"
                      onIonInput={(e) => setNewUserData({...newUserData, password: e.detail.value!})}
                      required
                    />
                  </IonItem>
                  {userFormErrors.password && (
                    <IonText color="danger" className="error-text">
                      {userFormErrors.password}
                    </IonText>
                  )}
                </div>

                <div className="form-section">
                  <IonItem className={userFormErrors.confirmPassword ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">Confirm Password *</IonLabel>
                    <IonInput
                      type="password"
                      value={newUserData.confirmPassword}
                      placeholder="Confirm password"
                      onIonInput={(e) => setNewUserData({...newUserData, confirmPassword: e.detail.value!})}
                      required
                    />
                  </IonItem>
                  {userFormErrors.confirmPassword && (
                    <IonText color="danger" className="error-text">
                      {userFormErrors.confirmPassword}
                    </IonText>
                  )}
                </div>

                <div className="create-user-summary" style={{
                  marginTop: "20px",
                  padding: "16px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "8px"
                }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "var(--ion-color-primary)" }}>User Summary</h4>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}>
                    <span><strong>Name:</strong></span>
                    <span>{newUserData.name || "Not set"}</span>
                  </div>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}>
                    <span><strong>Email:</strong></span>
                    <span>{newUserData.email || "Not set"}</span>
                  </div>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}>
                    <span><strong>Role:</strong></span>
                    <span>User (can be changed later)</span>
                  </div>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between"
                  }}>
                    <span><strong>Initial Credits:</strong></span>
                    <span>0 (can be added later)</span>
                  </div>
                </div>

                <IonButton
                  expand="block"
                  onClick={handleCreateUser}
                  disabled={createUser.isPending || !newUserData.name || !newUserData.email || !newUserData.password}
                  style={{ marginTop: "20px" }}
                >
                  {createUser.isPending
                    ? "Creating User..."
                    : "Create User"}
                </IonButton>

                <div className="create-user-note" style={{
                  marginTop: "16px",
                  textAlign: "center"
                }}>
                  <p>
                    <small>
                      Note: The user will be able to log in immediately with these credentials.
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
