import React, { useState, useMemo } from "react";
import { useUsersManagement } from "../hooks/AdminDataHooks";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import "../Admin/styles/admin.css";
import "../Admin/styles/admin-responsive.css";
import { useAdminStatus } from "@/hooks/AdminHooks";
import DynamicTable, { useTable } from "@/shared/DynamicTable/DynamicTable";
import { TableColumn } from "@/shared/DynamicTable/Interface/TableInterface";
import { IonButton, IonIcon } from "@ionic/react";
import { checkmarkCircleOutline, closeCircleOutline, arrowUpOutline, arrowDownOutline } from "ionicons/icons";

const UsersManagement: React.FC = () => {
  const { users, isLoading, error, toggleAdmin, approveUser, declineUser, refetch } =
    useUsersManagement();
  const { refetch: refetchAdminStatus, isAdmin } = useAdminStatus();
  const [filterType, setFilterType] = useState<"all" | "admin" | "user" | "pending">("all");
  
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
    try {
      await toggleAdmin.mutateAsync(userId);
      refetch();
    } catch (error) {
      console.error("Failed to toggle admin status:", error);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await approveUser.mutateAsync(userId);
      refetch();
    } catch (error) {
      console.error("Failed to approve user:", error);
    }
  };

  const handleDeclineUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to decline this user? This action cannot be undone.")) {
      try {
        await declineUser.mutateAsync(userId);
        refetch();
      } catch (error) {
        console.error("Failed to decline user:", error);
      }
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesFilter =
        filterType === "all" ||
        (filterType === "admin" && user.isAdmin) ||
        (filterType === "user" && !user.isAdmin) ||
        (filterType === "pending" && !user.isApproved);

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
      key: "isApproved",
      label: "Status",
      sortable: true,
      render: (value) => (
        <span className={`status-badge ${value ? 'approved' : 'pending'}`}>
          <span className="badge-icon">{value ? '✓' : '⏳'}</span>
          {value ? 'Approved' : 'Pending'}
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
          {!row.isApproved ? (
            <>
              <IonButton
                size="small"
                fill="clear"
                color="success"
                onClick={() => handleApproveUser(value)}
                disabled={approveUser.isPending || declineUser.isPending}
                title="Approve User"
              >
                <IonIcon slot="icon-only" icon={checkmarkCircleOutline} />
              </IonButton>
              <IonButton
                size="small"
                fill="clear"
                color="danger"
                onClick={() => handleDeclineUser(value)}
                disabled={approveUser.isPending || declineUser.isPending}
                title="Decline User"
              >
                <IonIcon slot="icon-only" icon={closeCircleOutline} />
              </IonButton>
            </>
          ) : (
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
          )}
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
            className={`filter-btn ${filterType === "pending" ? "active" : ""}`}
            onClick={() => setFilterType("pending")}
          >
            Pending ({users.filter((u) => !u.isApproved).length})
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
            Users ({users.filter((u) => !u.isAdmin && u.isApproved).length})
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
    </div>
  );
};
export default UsersManagement;
