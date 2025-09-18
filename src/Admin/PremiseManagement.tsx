import React, { useState } from "react";
import { usePremiseManagement } from "../hooks/AdminDataHooks";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import QRCode from "react-qr-code";
import { IonContent } from "@ionic/react";
import "./styles/admin.css";
export const PremiseManagement: React.FC = () => {
  const { codes, isLoading, error, createCode, refetch } =
    usePremiseManagement();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    location: "",
    validityHours: "",
  });

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createCode.mutateAsync({
        location: formData.location,
        validityHours: parseInt(formData.validityHours),
      });

      // Reset form
      setFormData({
        location: "",
        validityHours: "",
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create premise code:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You might want to show a toast notification here
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading premise codes..." />;
  }

  if (error) {
    return (
      <ErrorMessage message="Failed to load premise codes" onRetry={refetch} />
    );
  }

  return (
    <IonContent>
      <div className="premise-management">
        <div className="page-header">
          <div>
            <h1>Premise Management</h1>
            <p>Create and manage premise access QR codes</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? "Cancel" : "+ Create New QR Code"}
          </button>
        </div>

        {/* Create Code Form */}
        {showCreateForm && (
          <div className="create-form-section">
            <form onSubmit={handleCreateCode} className="create-premise-form">
              <h3>Create New Premise QR Code</h3>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Main Entrance, Library Reception"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="validityHours">
                    Validity Duration (Hours)
                  </label>
                  <select
                    id="validityHours"
                    name="validityHours"
                    value={formData.validityHours}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select duration</option>
                    <option value="1">1 Hour</option>
                    <option value="2">2 Hours</option>
                    <option value="4">4 Hours</option>
                    <option value="8">8 Hours</option>
                    <option value="12">12 Hours</option>
                    <option value="24">24 Hours</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={createCode.isPending}
                >
                  {createCode.isPending ? "Creating..." : "Create QR Code"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Premise Codes List */}
        <div className="premise-codes-grid">
          {codes.map((code) => (
            <div key={code.id} className="premise-code-card">
              <div className="premise-card-header">
                <h3>📍 {code.location}</h3>
                <span
                  className={`status-indicator ${code.isActive ? "active" : "inactive"}`}
                >
                  {code.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="premise-card-body">
                <div className="premise-detail">
                  <span className="detail-label">⏱️ Validity:</span>
                  <span className="detail-value">
                    {code.validityHours} hours
                  </span>
                </div>

                <div className="premise-detail">
                  <span className="detail-label">📅 Created:</span>
                  <span className="detail-value">
                    {new Date(code.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="premise-detail code-section">
                  <span className="detail-label">🔗 QR Code:</span>
                  <div className="code-container">
                    <span className="code-value">{code.code}</span>
                    <button
                      className="copy-button"
                      onClick={() => copyToClipboard(code.code)}
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                  <div className="qr-code-container">
                    <QRCode value={code.code} />
                  </div>
                </div>
              </div>

              <div className="premise-card-footer">
                <button className="btn btn-outline">Generate QR Image</button>
                <button className="btn btn-outline">Edit Location</button>
                <button
                  className={`btn ${code.isActive ? "btn-warning" : "btn-success"}`}
                >
                  {code.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {codes.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3>No premise codes created yet</h3>
            <p>
              Create your first premise QR code to enable building access
              control
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="instructions-section">
          <h3>How Premise QR Codes Work</h3>
          <div className="instructions-grid">
            <div className="instruction-card">
              <div className="instruction-icon">1️⃣</div>
              <h4>Create QR Code</h4>
              <p>
                Generate a QR code for each entrance location with specified
                validity duration
              </p>
            </div>

            <div className="instruction-card">
              <div className="instruction-icon">2️⃣</div>
              <h4>Display QR Code</h4>
              <p>
                Print and display the QR code at the designated entrance
                location
              </p>
            </div>

            <div className="instruction-card">
              <div className="instruction-icon">3️⃣</div>
              <h4>User Activation</h4>
              <p>
                Students scan the code with their mobile app to gain timed
                access
              </p>
            </div>

            <div className="instruction-card">
              <div className="instruction-icon">4️⃣</div>
              <h4>Access Control</h4>
              <p>
                Monitor and manage access duration for security and usage
                tracking
              </p>
            </div>
          </div>
        </div>
      </div>
    </IonContent>
  );
};
