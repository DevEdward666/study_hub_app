import React from "react";
import { Redirect } from "react-router-dom";
import { useAuth } from "../hooks/AuthHooks";
import { useAdminStatus } from "../hooks/AdminHooks";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();

  if (authLoading || adminLoading) {
    return (
      <div className="admin-loading">
        <LoadingSpinner message="Verifying admin access..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-unauthorized">
        <h1>Unauthorized</h1>
        <p>You don't have admin access to this area.</p>
      </div>
    );
  }

  return <>{children}</>;
};
