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
import SlideoutModal from "@/shared/SideOutModal/SideoutModalComponent";
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
  personAddOutline,
  pencilOutline
} from "ionicons/icons";

const UsersManagement: React.FC = () => {
  const { users, isLoading, error, toggleAdmin, addCredits, createUser, updateUser, refetch } =
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
    confirmPassword: "",
    role: "User"
  });
  const [userFormErrors, setUserFormErrors] = useState<{ [key: string]: string }>({});

  // Edit User Modal State
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editUserData, setEditUserData] = useState({
    userId: "",
    name: "",
    email: "",
    phone: "",
    role: "User"
  });
  const [editFormErrors, setEditFormErrors] = useState<{ [key: string]: string }>({});

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
        const newErrors: { [key: string]: string } = {};
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
        password: newUserData.password,
        role: newUserData.role
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
        confirmPassword: "",
        role: "Staff"
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

  // Edit User Functions
  const openEditUserModal = (userId: string) => {
    const user = users?.find(u => u.id === userId);
    if (!user) return;

    setEditUserData({
      userId: user.id,
      name: user.name || "",
      email: user.email,
      phone: "", // Phone not in current UserWithInfoDto, will be empty
      role: user.role
    });
    setEditFormErrors({});
    setIsEditUserModalOpen(true);
  };

  const validateEditForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!editUserData.name || editUserData.name.trim().length === 0) {
      errors.name = "Name is required";
    }

    if (!editUserData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUserData.email)) {
      errors.email = "Valid email is required";
    }

    if (!editUserData.role) {
      errors.role = "Role is required";
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateUser = async () => {
    if (!validateEditForm()) {
      return;
    }

    showConfirmation({
      header: 'Update User',
      message: `Are you sure you want to update this user?\n\nName: ${editUserData.name}\nEmail: ${editUserData.email}\nRole: ${editUserData.role}\n\nChanges will be applied immediately.`,
      confirmText: 'Update User',
      cancelText: 'Cancel'
    }, async () => {
      await performUpdateUser();
    });
  };

  const performUpdateUser = async () => {
    try {
      await updateUser.mutateAsync({
        userId: editUserData.userId,
        name: editUserData.name,
        email: editUserData.email,
        role: editUserData.role,
        phone: editUserData.phone || undefined
      });

      setToastMessage(`Successfully updated user: ${editUserData.name}`);
      setToastColor("success");
      setShowToast(true);
      setIsEditUserModalOpen(false);

      // Reset form
      setEditUserData({
        userId: "",
        name: "",
        email: "",
        phone: "",
        role: "Staff"
      });
      setEditFormErrors({});

      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update user";
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
      key: "role",
      label: "Role",
      sortable: true,
      render: (value) => {
        const roleConfig = {
          "Customer": { color: "#3880ff", bgColor: "#e3f2fd" },
          "Staff": { color: "#666", bgColor: "#f5f5f5" },
          "Admin": { color: "#3880ff", bgColor: "#e3f2fd" },
          "Super Admin": { color: "#d32f2f", bgColor: "#ffebee" }
        };
        const config = roleConfig[value as keyof typeof roleConfig] || roleConfig["Staff"];

        return (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 12px",
            borderRadius: "12px",
            fontSize: "0.85em",
            fontWeight: "500",
            color: config.color,
            backgroundColor: config.bgColor
          }}>
            {value}
          </span>
        );
      },
    },
    {
      key: "isAdmin",
      label: "Admin Status",
      sortable: true,
      render: (value) => (
        <span className={`status-badge ${value ? 'admin' : 'user'}`}>
          {value ? <IonIcon icon={checkmarkCircleOutline} color="success" /> : <IonIcon icon={closeCircleOutline} color="medium" />}
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
            color="secondary"
            onClick={() => openEditUserModal(value)}
            disabled={updateUser.isPending}
            title="Edit User"
          >
            <IonIcon slot="icon-only" icon={pencilOutline} />
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
        <div className="header-content">
          <div className="header-text">
            <h2 style={{ color: 'var(--ion-color-primary)' }}>User Management</h2>
            <p>Manage users and admin permissions</p>
          </div>

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
      <SlideoutModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Create New User"
        size="medium"
      >
        <div className="create-user-form" style={{ padding: "20px" }}>

          <div className="form-section">
            <IonItem className={userFormErrors.name ? 'ion-invalid' : ''}>
              <IonLabel position="stacked">Full Name *</IonLabel>
              <IonInput
                type="text"
                value={newUserData.name}
                placeholder="Enter full name"
                onIonInput={(e) => setNewUserData({ ...newUserData, name: e.detail.value! })}
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
                onIonInput={(e) => setNewUserData({ ...newUserData, email: e.detail.value! })}
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
            <IonItem>
              <IonLabel position="stacked">Role *</IonLabel>
              <IonSelect
                value={newUserData.role}
                placeholder="Select role"
                onIonChange={(e) => setNewUserData({ ...newUserData, role: e.detail.value })}
              >
                <IonSelectOption value="Customer">Customer</IonSelectOption>
                <IonSelectOption value="Staff">Staff</IonSelectOption>
                <IonSelectOption value="Admin">Admin</IonSelectOption>
                <IonSelectOption value="Super Admin">Super Admin</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonText color="medium" style={{ fontSize: "0.85em", marginTop: "4px", display: "block", paddingLeft: "16px" }}>
              <small>Customer: Regular customer | Staff: Employee access | Admin: Admin dashboard | Super Admin: Full system access</small>
            </IonText>
          </div>

          <div className="form-section">
            <IonItem className={userFormErrors.password ? 'ion-invalid' : ''}>
              <IonLabel position="stacked">Password *</IonLabel>
              <IonInput
                type="password"
                value={newUserData.password}
                placeholder="Create a password"
                onIonInput={(e) => setNewUserData({ ...newUserData, password: e.detail.value! })}
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
                onIonInput={(e) => setNewUserData({ ...newUserData, confirmPassword: e.detail.value! })}
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
              <span>{newUserData.role}</span>
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
        </div>
      </SlideoutModal>

      {/* Edit User Modal */}
      <SlideoutModal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        title="Edit User"
        size="medium"
      >
        <div className="edit-user-form" style={{ padding: "20px" }}>

          <div className="form-section">
            <IonItem className={editFormErrors.name ? 'ion-invalid' : ''}>
              <IonLabel position="stacked">Full Name *</IonLabel>
              <IonInput
                type="text"
                value={editUserData.name}
                placeholder="Enter full name"
                onIonInput={(e) => setEditUserData({ ...editUserData, name: e.detail.value! })}
                required
              />
            </IonItem>
            {editFormErrors.name && (
              <IonText color="danger" className="error-text">
                <small>{editFormErrors.name}</small>
              </IonText>
            )}
          </div>

          <div className="form-section">
            <IonItem className={editFormErrors.email ? 'ion-invalid' : ''}>
              <IonLabel position="stacked">Email Address *</IonLabel>
              <IonInput
                type="email"
                value={editUserData.email}
                placeholder="Enter email address"
                onIonInput={(e) => setEditUserData({ ...editUserData, email: e.detail.value! })}
                required
              />
            </IonItem>
            {editFormErrors.email && (
              <IonText color="danger" className="error-text">
                <small>{editFormErrors.email}</small>
              </IonText>
            )}
          </div>

          <div className="form-section">
            <IonItem>
              <IonLabel position="stacked">Phone Number</IonLabel>
              <IonInput
                type="tel"
                value={editUserData.phone}
                placeholder="Enter phone number"
                onIonInput={(e) => setEditUserData({ ...editUserData, phone: e.detail.value! })}
              />
            </IonItem>
          </div>

          <div className="form-section">
            <IonItem className={editFormErrors.role ? 'ion-invalid' : ''}>
              <IonLabel position="stacked">Role *</IonLabel>
              <IonSelect
                value={editUserData.role}
                placeholder="Select role"
                onIonChange={(e) => setEditUserData({ ...editUserData, role: e.detail.value })}
              >
                <IonSelectOption value="Customer">Customer</IonSelectOption>
                <IonSelectOption value="Staff">Staff</IonSelectOption>
                <IonSelectOption value="Admin">Admin</IonSelectOption>
                <IonSelectOption value="Super Admin">Super Admin</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonText color="medium" style={{ fontSize: "0.85em", marginTop: "4px", display: "block", paddingLeft: "16px" }}>
              <small>Customer: Regular customer | Staff: Employee access | Admin: Admin dashboard | Super Admin: Full system access</small>
            </IonText>
            {editFormErrors.role && (
              <IonText color="danger" className="error-text">
                <small>{editFormErrors.role}</small>
              </IonText>
            )}
          </div>

          <div className="edit-user-summary" style={{
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
              <span>{editUserData.name || "Not set"}</span>
            </div>
            <div className="summary-row" style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px"
            }}>
              <span><strong>Email:</strong></span>
              <span>{editUserData.email || "Not set"}</span>
            </div>
            <div className="summary-row" style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px"
            }}>
              <span><strong>Phone:</strong></span>
              <span>{editUserData.phone || "Not set"}</span>
            </div>
            <div className="summary-row" style={{
              display: "flex",
              justifyContent: "space-between"
            }}>
              <span><strong>Role:</strong></span>
              <span>{editUserData.role}</span>
            </div>
          </div>

          <IonButton
            expand="block"
            onClick={handleUpdateUser}
            disabled={updateUser.isPending || !editUserData.name || !editUserData.email}
            style={{ marginTop: "20px" }}
          >
            {updateUser.isPending
              ? "Updating User..."
              : "Update User"}
          </IonButton>

          <div className="edit-user-note" style={{
            marginTop: "16px",
            textAlign: "center"
          }}>
            <p>
              <small>
                Note: Changes will be applied immediately. Role changes will automatically update admin permissions.
              </small>
            </p>
          </div>
        </div>
      </SlideoutModal>

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
