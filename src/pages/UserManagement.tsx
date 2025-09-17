import React from "react";
import { useUsersManagement } from "../hooks/AdminDataHooks";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";

export const UsersManagement: React.FC = () => {
  const { users, isLoading, error, toggleAdmin, refetch } =
    useUsersManagement();

  const handleToggleAdmin = async (userId: string) => {
    try {
      await toggleAdmin.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to toggle admin status:", error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading users..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load users" onRetry={refetch} />;
  }

  return (
    <div className="users-management">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage users and admin permissions</p>
      </div>

      <div className="users-table">
        <div className="table-header">
          <div className="col-user">User</div>
          <div className="col-credits">Credits</div>
          <div className="col-status">Status</div>
          <div className="col-session">Session</div>
          <div className="col-actions">Actions</div>
        </div>

        <div className="table-body">
          {users.map((user) => (
            <div key={user.id} className="table-row">
              <div className="col-user">
                <div className="user-cell">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
              <div className="col-credits">
                <span className="credits">{user.credits}</span>
              </div>
              <div className="col-status">
                {user.isAdmin ? (
                  <span className="status-badge admin">Admin</span>
                ) : (
                  <span className="status-badge user">User</span>
                )}
              </div>
              <div className="col-session">
                {user.hasActiveSession ? (
                  <span className="session-badge active">Active</span>
                ) : (
                  <span className="session-badge inactive">Inactive</span>
                )}
              </div>
              <div className="col-actions">
                <button
                  className={`btn ${user.isAdmin ? "btn-warning" : "btn-primary"}`}
                  onClick={() => handleToggleAdmin(user.id)}
                  disabled={toggleAdmin.isPending}
                >
                  {user.isAdmin ? "Remove Admin" : "Make Admin"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
