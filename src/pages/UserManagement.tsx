import React, { useState } from "react";
import { useUsersManagement } from "../hooks/AdminDataHooks";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import "../Admin/styles/admin.css";
import { useAdminStatus } from "@/hooks/AdminHooks";
const UsersManagement: React.FC = () => {
  const { users, isLoading, error, toggleAdmin, refetch } =
    useUsersManagement();
  const { refetch: refetchAdminStatus, isAdmin } = useAdminStatus();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "admin" | "user">("all");

  const handleToggleAdmin = async (userId: string) => {
    try {
      await toggleAdmin.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to toggle admin status:", error);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === "all" ||
      (filterType === "admin" && isAdmin) ||
      (filterType === "user" && !isAdmin);

    return matchesSearch && matchesFilter;
  });

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

      {/* Search and Filter */}
      <div className="controls-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

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

      {/* Users Table */}
      <div className="users-table">
        <div className="table-header">
          <div className="col-user">User</div>
          <div className="col-email">Email</div>
          <div className="col-credits">Credits</div>
          <div className="col-status">Status</div>
          <div className="col-session">Session</div>
          <div className="col-joined">Joined</div>
          <div className="col-actions">Action</div>

          {/* <div className="col-actions">Actions</div> */}
        </div>

        <div className="table-body">
          {filteredUsers.map((user) => (
            <div key={user.id} className="table-row">
              <div className="col-user">
                <span className="user">{user.name || "Unknown"}</span>
              </div>
              <div className="col-email">
                <span className="user">{user.email}</span>
              </div>
              <div className="col-credits">
                <span className="credits">{user.credits}</span>
              </div>
              <div className="col-status">
                {isAdmin ? (
                  <span className="status-badge admin">
                    <span className="badge-icon"></span>
                    Admin
                  </span>
                ) : (
                  <span className="status-badge user">
                    <span className="badge-icon">👤</span>
                    User
                  </span>
                )}
              </div>
              <div className="col-session">
                {user.hasActiveSession ? (
                  <span className="session-badge active">
                    <span className="session-dot active"></span>
                    Active
                  </span>
                ) : (
                  <span className="session-badge inactive">
                    <span className="session-dot inactive"></span>
                    Inactive
                  </span>
                )}
              </div>
              <div className="col-joined">
                <span className="joined-date">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="col-action">
                <button
                  className={`btn ${isAdmin ? "btn-warning" : "btn-primary"}`}
                  onClick={() => handleToggleAdmin(user.id)}
                  disabled={toggleAdmin.isPending}
                >
                  {toggleAdmin.isPending ? (
                    <span className="btn-loading">...</span>
                  ) : (
                    <>{isAdmin ? <>Remove Admin</> : <>Make Admin</>}</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="empty-state">
          <h3>No users found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};
export default UsersManagement;
