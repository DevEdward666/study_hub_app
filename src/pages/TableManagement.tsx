import React, { useState } from "react";
import { useTablesManagement } from "../hooks/AdminDataHooks";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import "../Admin/styles/admin.css";
import QRCode from "react-qr-code";
const TablesManagement: React.FC = () => {
  const { tables, isLoading, error, createTable, refetch } =
    useTablesManagement();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    tableNumber: "",
    hourlyRate: "",
    location: "",
    capacity: "",
  });

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTable.mutateAsync({
        tableNumber: formData.tableNumber,
        hourlyRate: parseFloat(formData.hourlyRate),
        location: formData.location,
        capacity: parseInt(formData.capacity),
      });

      // Reset form
      setFormData({
        tableNumber: "",
        hourlyRate: "",
        location: "",
        capacity: "",
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create table:", error);
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

  if (isLoading) {
    return <LoadingSpinner message="Loading tables..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load tables" onRetry={refetch} />;
  }
  const handleViewQR = () => {};
  return (
    <div className="tables-management">
      <div className="page-header">
        <h1>Table Management</h1>
        <p>Create and manage study tables</p>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Cancel" : "+ Create New Table"}
        </button>
      </div>

      {/* Create Table Form */}
      {showCreateForm && (
        <div className="create-form-section">
          <form onSubmit={handleCreateTable} className="create-table-form">
            <h3>Create New Table</h3>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="tableNumber">Table Number</label>
                <input
                  type="text"
                  id="tableNumber"
                  name="tableNumber"
                  value={formData.tableNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., A1, B2, C3"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="hourlyRate">Hourly Rate (Credits)</label>
                <input
                  type="number"
                  id="hourlyRate"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  placeholder="e.g., 5"
                  min="0.1"
                  step="0.1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Ground Floor, Second Floor"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="capacity">Capacity (People)</label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  placeholder="e.g., 1, 2, 4"
                  min="1"
                  required
                />
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
                disabled={createTable.isPending}
              >
                {createTable.isPending ? "Creating..." : "Create Table"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tables List */}
      <div className="tables-grid">
        {tables.map((table) => (
          <div key={table.id} className="table-card">
            <div className="table-card-header">
              <h3>Table {table.tableNumber}</h3>
              <span
                className={`status-indicator ${table.isOccupied ? "occupied" : "available"}`}
              >
                {table.isOccupied ? "Occupied" : "Available"}
              </span>
            </div>

            <div className="table-card-body">
              <div className="table-detail">
                <span className="detail-label">📍 Location:</span>
                <span className="detail-value">{table.location}</span>
              </div>

              <div className="table-detail">
                <span className="detail-label">👥 Capacity:</span>
                <span className="detail-value">{table.capacity} people</span>
              </div>

              <div className="table-detail">
                <span className="detail-label">💰 Rate:</span>
                <span className="detail-value">
                  {table.hourlyRate} credits/hour
                </span>
              </div>

              <div className="table-detail">
                <span className="detail-label">
                  <span className="detail-qr">
                    🔗 QR Code: <QRCode value={table.qrCode} />
                  </span>
                </span>
              </div>
            </div>

            <div className="table-card-footer">
              {/* <button className="btn btn-outline" >View QR Code</button> */}
              <button className="btn btn-outline">Edit Table</button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="empty-state">
          <h3>No tables created yet</h3>
          <p>Create your first study table to get started</p>
        </div>
      )}
    </div>
  );
};
export default TablesManagement;
