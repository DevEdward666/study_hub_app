// src/admin/pages/AdminLogin.tsx
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useAuth } from "../hooks/AuthHooks";
import { useAdminStatus } from "../hooks/AdminHooks";
import { LoginRequestSchema } from "../schema/auth.schema";
import { z } from "zod";
import "./styles/admin-login.css";
import { IonContent, IonPage } from "@ionic/react";

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { signIn } = useAuth();
  const { refetch: refetchAdminStatus } = useAdminStatus();
  const history = useHistory();

  const validateForm = (): boolean => {
    try {
      LoginRequestSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await signIn.mutateAsync({ email, password });

      // Check if user is admin after login
      const adminStatus = await refetchAdminStatus();
      if (adminStatus.data) {
        history.replace("/app/admin/dashboard");
      } else {
        setErrorMessage("Access denied. Admin privileges required.");
        setShowError(true);
        localStorage.removeItem("auth_token");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setErrorMessage(message);
      setShowError(true);
    }
  };

  return (
    <IonPage>
      <IonContent>
        <div className="admin-login-container">
          <div className="admin-login-card">
            <div className="admin-login-header">
              <div className="admin-logo">
                <div className="logo-icon">🏢</div>
                <h1>StudyHub Admin</h1>
              </div>
              <p>Sign in to access the admin dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="admin-login-form">
              {showError && (
                <div className="error-alert">
                  <span className="error-icon">⚠️</span>
                  {errorMessage}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@studyhub.com"
                  className={errors.email ? "error" : ""}
                  required
                />
                {errors.email && (
                  <span className="field-error">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={errors.password ? "error" : ""}
                  required
                />
                {errors.password && (
                  <span className="field-error">{errors.password}</span>
                )}
              </div>

              <button
                type="submit"
                className="admin-login-button"
                disabled={signIn.isPending}
              >
                {signIn.isPending ? (
                  <>
                    <div className="spinner"></div>
                    Signing in...
                  </>
                ) : (
                  "Sign In to Admin Panel"
                )}
              </button>
            </form>

            <div className="admin-login-footer">
              <p>
                <small>
                  Only authorized administrators can access this panel.
                  <br />
                  Contact your system administrator if you need access.
                </small>
              </p>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};
