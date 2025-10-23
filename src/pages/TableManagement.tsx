import React, { useRef, useState } from "react";
import {
  PremiseManagementServiceAPI,
  TableManagementServiceAPI,
  useTablesManagement,
  useUsersManagement,
} from "../hooks/AdminDataHooks";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import "../Admin/styles/admin.css";
import "../Admin/styles/admin-responsive.css";
import QRCode from "react-qr-code";
import DynamicTable, { useTable } from "@/shared/DynamicTable/DynamicTable";
import { GetTablesTableColumn } from "@/schema/table.schema";
import { TableColumn } from "@/shared/DynamicTable/Interface/TableInterface";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonInput,
  IonItem,
  IonLabel,
  IonRange,
  IonToolbar,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonToast,
} from "@ionic/react";
import { createTableStatusChip } from "@/shared/DynamicTable/Utls/TableUtils";
import SlideoutModal from "@/shared/SideOutModal/SideoutModalComponent";
import { playCircleOutline, stopCircleOutline } from "ionicons/icons";
import { tableService } from "@/services/table.service";
import { useMutation } from "@tanstack/react-query";
import { SessionTimer } from "@/components/common/SessionTimer";
const TablesManagement: React.FC = () => {
  const {
    tables,
    isLoading,
    error,
    createTable,
    selectedTable,
    updateTable,
    refetch,
  } = useTablesManagement();
  const {
    tableState,
    updateState,
    data,
    isLoading: IsLoadingtable,
    isError,
    error: IsErrorTable,
    refetch: RefetchTable,
    isFetching,
  } = useTable({
    queryKey: "premise-table",
    fetchFn: TableManagementServiceAPI.fetchTables,
    initialState: { pageSize: 10 },
  });

  // Auto-refresh table data every 30 seconds to keep timers in sync
  React.useEffect(() => {
    const interval = setInterval(() => {
      RefetchTable();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [RefetchTable]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [qrSize, setQrSize] = useState<number>(128);
  const [openSelectedRow, setOpenSelectedRow] = useState({
    open: false,
    qr: "",
    tableName: "",
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showStartSessionModal, setShowStartSessionModal] = useState(false);
  const [selectedTableForSession, setSelectedTableForSession] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [sessionHours, setSessionHours] = useState<number>(1);
  const [formData, setFormData] = useState({
    tableID: "",
    tableNumber: "",
    hourlyRate: "",
    location: "",
    capacity: "",
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");

  const { users } = useUsersManagement();

  const startSessionMutation = useMutation({
    mutationFn: async (data: { tableId: string; userId: string; hours: number; qrCode: string }) => {
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + data.hours);
      
      return tableService.startSession({
        tableId: data.tableId,
        userId: data.userId,
        qrCode: data.qrCode, // Use table's QR code for admin-initiated sessions
        hours: data.hours,
        endTime: endTime.toISOString(),
      });
    },
    onSuccess: () => {
      RefetchTable();
      setShowStartSessionModal(false);
      setSelectedTableForSession(null);
      setSelectedUserId("");
      setSessionHours(1);
      setToastMessage("🎉 Session started successfully!");
      setToastColor("success");
      setShowToast(true);
    },
    onError: (error: any) => {
      setToastMessage(`Failed to start session: ${error.message || "Unknown error"}`);
      setToastColor("danger");
      setShowToast(true);
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return tableService.endSession(sessionId);
    },
    onSuccess: () => {
      RefetchTable();
      setToastMessage("Session ended successfully!");
      setToastColor("success");
      setShowToast(true);
    },
    onError: (error: any) => {
      setToastMessage(`Failed to end session: ${error.message || "Unknown error"}`);
      setToastColor("danger");
      setShowToast(true);
    },
  });

  const handleEndSession = async (sessionId: string, tableNumber?: string) => {
    if (window.confirm(`Are you sure you want to end the session for Table ${tableNumber || ''}?`)) {
      endSessionMutation.mutate(sessionId);
    }
  };

  const handleSessionTimeUp = (sessionId: string, tableNumber?: string) => {
    console.log(`Session time expired for Table ${tableNumber}, automatically ending session:`, sessionId);
    endSessionMutation.mutate(sessionId);
    setToastMessage(`⏰ Time's up! Session for Table ${tableNumber} has been automatically ended.`);
    setToastColor("warning");
    setShowToast(true);
  };
  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateTable.mutateAsync({
        tableID: formData.tableID,
        tableNumber: formData.tableNumber,
        hourlyRate: parseFloat(formData.hourlyRate),
        location: formData.location,
        capacity: parseInt(formData.capacity),
      });
      RefetchTable();
      // Reset form
      setFormData({
        tableID: "",
        tableNumber: "",
        hourlyRate: "",
        location: "",
        capacity: "",
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to update table:", error);
    }
  };
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTable.mutateAsync({
        tableNumber: formData.tableNumber,
        hourlyRate: parseFloat(formData.hourlyRate),
        location: formData.location,
        capacity: parseInt(formData.capacity),
      });
      RefetchTable();
      // Reset form
      setFormData({
        tableID: "",
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
  const handleRowClick = (val: any) => {
    setOpenSelectedRow({
      open: true,
      qr: val.qrCode,
      tableName: val.tableNumber,
    });
  };
  const handleViewQR = () => {};
  const columns: TableColumn<GetTablesTableColumn>[] = [
    { key: "tableNumber", label: "Table Number", sortable: false },
    {
      key: "location",
      label: "Location",
      sortable: true,
      render: (value) => value,
    },
    {
      key: "capacity",
      label: "Capacity",
      sortable: true,
      render: (value) => value,
    },
    {
      key: "hourlyRate",
      label: "Hourly Rate",
      sortable: true,
      render: (value) => value,
    },
    {
      key: "isOccupied",
      label: "Status",
      sortable: true,
      render: (value, row) => {
        // Check if table is occupied and has a session with endTime
        if (value && row.currentSession?.endTime) {
          console.log(`Timer for Table ${row.tableNumber}:`, row.currentSession.endTime);
          return (
            <SessionTimer
              endTime={row.currentSession.endTime}
              onTimeUp={() => handleSessionTimeUp(row.currentSession!.id, row.tableNumber)}
            />
          );
        }
        return createTableStatusChip(value === true ? "Occupied" : "Available");
      },
    },
    {
      key: "id",
      label: "Actions",
      sortable: false,
      render: (value, row) => (
        <>
          <IonButton
            size="small"
            fill="clear"
            color="dark"
            onClick={() => handleSetUpdate(value)}
            title="Update Table"
          >
            <IonIcon slot="icon-only" icon={playCircleOutline} style={{ transform: 'rotate(-90deg)' }} />
          </IonButton>
          {row.isOccupied && row.currentSession ? (
            <IonButton
              size="small"
              fill="clear"
              color="danger"
              onClick={(e) => {
                e.stopPropagation();
                if (row.currentSession) {
                  handleEndSession(row.currentSession.id, row.tableNumber);
                }
              }}
              title="End Session"
            >
              <IonIcon slot="icon-only" icon={stopCircleOutline} />
            </IonButton>
          ) : (
            <IonButton
              size="small"
              fill="clear"
              color="dark"
              onClick={(e) => {
                e.stopPropagation();
                handleStartSession(row);
              }}
              title="Start Session"
            >
              <IonIcon slot="icon-only" icon={playCircleOutline} />
            </IonButton>
          )}
        </>
      ),
    },
  ];
  const handleSetUpdate = async (val: any) => {
    await selectedTable.mutateAsync({
      tableId: val,
    });
    console.log(selectedTable.data);
    setFormData({
      tableID: selectedTable.data?.tableID!,
      tableNumber: selectedTable.data?.tableNumber!,
      hourlyRate: selectedTable.data?.hourlyRate.toString()!,
      location: selectedTable.data?.location!,
      capacity: selectedTable.data?.capacity.toString()!,
    });
    setShowCreateForm(true);
  };

  const handleStartSession = (table: any) => {
    setSelectedTableForSession(table);
    setShowStartSessionModal(true);
  };

  const handleConfirmStartSession = () => {
    if (!selectedUserId) {
      alert("Please select a user");
      return;
    }
    if (!selectedTableForSession) {
      alert("No table selected");
      return;
    }

    startSessionMutation.mutate({
      tableId: selectedTableForSession.id,
      userId: selectedUserId,
      hours: sessionHours,
      qrCode: selectedTableForSession.qrCode, // Include table's QR code
    });
  };
  // const handleShowQR = (val: any) => {
  //   setOpenSelectedRow({
  //     open: true,
  //     qr: val.qrCode,
  //     tableName: val.tableNumber,
  //   });
  // };
  const handleCloseSelectedCollectionModal = () => {
    setOpenSelectedRow({ open: false, qr: "", tableName: "" });
  };
  const handleDownloadQr = () => {
    if (!containerRef.current) return;
    setIsExporting(true);

    try {
      const svgElement = containerRef.current.querySelector("svg");
      if (!svgElement) return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      // Add padding to canvas dimensions
      const totalWidth = qrSize + 100;
      const totalHeight = qrSize + 100;

      canvas.width = totalWidth;
      canvas.height = totalHeight;

      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, totalWidth, totalHeight);

          ctx.drawImage(img, 50, 50, qrSize, qrSize);

          ctx.fillStyle = "#333";
          ctx.font = "14px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            `Table - ${openSelectedRow.tableName}`,
            totalWidth / 2,
            totalHeight - 25
          );

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `table-${openSelectedRow.qr}-${openSelectedRow.tableName}-qr.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }
              setIsExporting(false);
            },
            "image/png",
            1.0
          );
        }
      };

      // Create a new SVG without padding for consistent export
      const qrSvgOnly = svgElement.cloneNode(true) as SVGElement;
      if (qrSvgOnly.style) {
        qrSvgOnly.style.padding = "0";
      }
      const cleanSvgData = new XMLSerializer().serializeToString(qrSvgOnly);
      img.src = "data:image/svg+xml;base64," + btoa(cleanSvgData);
    } catch (error) {
      console.error("Error exporting QR code:", error);
      setIsExporting(false);
    }
  };
  return (
    <IonContent>
      <div className="tables-management">
        <div className="page-header">
          <h1>Table Management</h1>
          <p>Create and manage study tables</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setFormData({
                tableID: "",
                tableNumber: "",
                hourlyRate: "",
                location: "",
                capacity: "",
              });
            }}
          >
            {showCreateForm ? "Cancel" : "+ Create New Table"}
          </button>
        </div>

        {/* Create Table Form */}
        {showCreateForm && (
          <div className="create-form-section">
            <form
              onSubmit={
                formData.tableID?.length > 0
                  ? handleUpdateTable
                  : handleCreateTable
              }
              className="create-table-form"
            >
              <h3>
                {formData.tableID?.length > 0
                  ? "Update Table"
                  : "Create New Table"}
              </h3>

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
                {formData.tableID?.length > 0 ? (
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={updateTable.isPending}
                  >
                    {updateTable.isPending ? "Updating..." : "Update Table"}
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={createTable.isPending}
                  >
                    {createTable.isPending ? "Creating..." : "Create Table"}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
        <DynamicTable
          columns={columns}
          data={data?.data}
          total={data?.total}
          totalPages={data?.totalPages}
          isLoading={isLoading || isFetching}
          isError={isError}
          error={error}
          onRefetch={refetch}
          tableState={tableState}
          onStateChange={updateState}
          onRowClick={handleRowClick}
          searchPlaceholder="Search entries..."
          emptyMessage="No entries found"
          loadingMessage="Loading entries..."
          pageSizeOptions={[10, 20, 50, 100]}
        />
        {/* Tables List */}
        {/* <div className="tables-grid">
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
              <button className="btn btn-outline">Edit Table</button>
            </div>
          </div>
        ))}
      </div> */}

        {tables.length === 0 && (
          <div className="empty-state">
            <h3>No tables created yet</h3>
            <p>Create your first study table to get started</p>
          </div>
        )}
      </div>
      <SlideoutModal
        isOpen={openSelectedRow.open}
        onClose={() => handleCloseSelectedCollectionModal()}
        title={`QR Code`}
        position="end"
        size="large"
      >
        <div className="qr-controls">
          <IonItem lines="none">
            <IonLabel>QR Size: {qrSize}px</IonLabel>
            <IonRange
              min={128}
              max={346}
              step={16}
              value={qrSize}
              onIonChange={(e) => setQrSize(e.detail.value as number)}
            />
          </IonItem>
        </div>

        <div
          ref={containerRef}
          className="qr-code-container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "20px 0",
            padding: "15px",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <QRCode
            size={qrSize}
            level="H"
            value={openSelectedRow.qr}
            style={{ padding: `25px` }}
          />
        </div>
        <IonFooter className="ion-no-border">
          <IonToolbar className="qr-modal-footer">
            <IonButtons slot="end" className="modal-action-buttons">
              <IonButton
                size="default"
                onClick={() =>
                  setOpenSelectedRow({ open: false, qr: "", tableName: "" })
                }
              >
                Close
              </IonButton>
              <IonButton
                size="default"
                onClick={handleDownloadQr}
                disabled={isExporting}
              >
                {isExporting ? "Exporting..." : "Download PNG"}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonFooter>
      </SlideoutModal>

      {/* Start Session Modal */}
      <SlideoutModal
        isOpen={showStartSessionModal}
        onClose={() => {
          setShowStartSessionModal(false);
          setSelectedTableForSession(null);
          setSelectedUserId("");
          setSessionHours(1);
        }}
        title="Start Session"
        position="end"
        size="large"
      >
        <div style={{ padding: "20px" }}>
          <h3>Table: {selectedTableForSession?.tableNumber}</h3>
          <p>Location: {selectedTableForSession?.location}</p>
          <p>Rate: {selectedTableForSession?.hourlyRate} credits/hour</p>

          <IonItem style={{ marginTop: "20px" }}>
            <IonLabel>Select User</IonLabel>
            <IonSelect
              value={selectedUserId}
              placeholder="Choose a user"
              onIonChange={(e) => setSelectedUserId(e.detail.value)}
            >
              {users.map((user) => (
                <IonSelectOption key={user.id} value={user.id}>
                  {user.name || user.email} - {user.credits} credits
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <IonItem style={{ marginTop: "20px" }}>
            <IonLabel>Hours: {sessionHours}</IonLabel>
            <IonRange
              min={1}
              max={12}
              step={1}
              value={sessionHours}
              pin={true}
              onIonChange={(e) => setSessionHours(e.detail.value as number)}
            />
          </IonItem>

          <div style={{ marginTop: "20px", padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
            <p><strong>Total Credits:</strong> {(selectedTableForSession?.hourlyRate || 0) * sessionHours}</p>
            <p><strong>End Time:</strong> {new Date(Date.now() + sessionHours * 60 * 60 * 1000).toLocaleString()}</p>
          </div>
        </div>

        <IonFooter className="ion-no-border">
          <IonToolbar>
            <IonButtons slot="end" className="modal-action-buttons">
              <IonButton
                onClick={() => {
                  setShowStartSessionModal(false);
                  setSelectedTableForSession(null);
                  setSelectedUserId("");
                  setSessionHours(1);
                }}
              >
                Cancel
              </IonButton>
              <IonButton
                onClick={handleConfirmStartSession}
                disabled={!selectedUserId || startSessionMutation.isPending}
                color="primary"
                fill="solid"
              >
                {startSessionMutation.isPending ? "Starting..." : "Start Session"}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonFooter>
      </SlideoutModal>

      {/* Toast Notifications */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={4000}
        color={toastColor}
        position="top"
      />
    </IonContent>
  );
};
export default TablesManagement;
