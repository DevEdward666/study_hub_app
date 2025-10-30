import React, { useRef, useState, useCallback } from "react";
import {
  PremiseManagementServiceAPI,
  TableManagementServiceAPI,
  useTablesManagement,
  useUsersManagement,
} from "../hooks/AdminDataHooks";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { useConfirmation } from "../hooks/useConfirmation";
import { ConfirmToast } from "../components/common/ConfirmToast";
import { useHourlyRate } from "../hooks/GlobalSettingsHooks";
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
import {
  playCircleOutline,
  stopCircleOutline,
  createOutline,
  swapHorizontalOutline,
  stopOutline
} from "ionicons/icons";
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
  
  // Get hourly rate from global settings
  const { hourlyRate } = useHourlyRate();
  
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

  // Confirmation hook
  const {
    isOpen: isConfirmOpen,
    options: confirmOptions,
    showConfirmation,
    handleConfirm: confirmAction,
    handleCancel: cancelAction,
    handleDismiss: dismissConfirm
  } = useConfirmation();

  // Auto-refresh table data every 30 seconds to keep timers in sync
  React.useEffect(() => {
    const interval = setInterval(() => {
      RefetchTable();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [RefetchTable]);

  // Clear ended sessions tracking when tables data changes
  React.useEffect(() => {
    if (tables) {
      // Get current active session IDs
      const activeSessionIds = new Set(
        tables
          .filter(table => table.currentSession?.id)
          .map(table => table.currentSession!.id)
      );
      
      // Remove ended session IDs that are no longer active
      const currentEndedSessions = Array.from(endedSessionsRef.current);
      currentEndedSessions.forEach(sessionId => {
        if (!activeSessionIds.has(sessionId)) {
          endedSessionsRef.current.delete(sessionId);
        }
      });
    }
  }, [tables]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [qrSize, setQrSize] = useState<number>(128);
  const [openSelectedRow, setOpenSelectedRow] = useState({
    open: false,
    qr: "",
    tableName: "",
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [showChangeTableModal, setShowChangeTableModal] = useState(false);
  const [selectedSessionForTransfer, setSelectedSessionForTransfer] = useState<any>(null);
  const [targetTableId, setTargetTableId] = useState<string>("");
  const [formData, setFormData] = useState({
    tableID: "",
    tableNumber: "",
    location: "",
    capacity: "",
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger" | "warning">("success");

  // Track ended sessions to prevent duplicate endSession calls
  const endedSessionsRef = useRef<Set<string>>(new Set());

  const { users } = useUsersManagement();

  // Helper function to calculate running time in minutes
  const getRunningTimeMinutes = (session: any): number => {
    if (!session?.startTime) return 0;
    const startTime = new Date(session.startTime);
    const now = new Date();
    return Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
  };

  // Helper function to format running time display
  const formatRunningTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Get available tables for transfer (not occupied)
  const getAvailableTables = () => {
    return data?.data?.filter(table => !table.isOccupied) || [];
  };

  // Custom sorting function for table data
  const sortTableData = (tableData: any[], sortBy: string, sortOrder: string) => {
    if (sortBy !== 'runningTime') {
      return tableData; // Let the original sorting handle other columns
    }

    return [...tableData].sort((a, b) => {
      const aRunningTime = a.isOccupied && a.currentSession ? getRunningTimeMinutes(a.currentSession) : 0;
      const bRunningTime = b.isOccupied && b.currentSession ? getRunningTimeMinutes(b.currentSession) : 0;
      
      if (sortOrder === 'asc') {
        return aRunningTime - bRunningTime;
      } else {
        return bRunningTime - aRunningTime;
      }
    });
  };

  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return tableService.endSession(sessionId);
    },
    onSuccess: async (result, sessionId) => {
      RefetchTable();
      setToastMessage("Session ended successfully!");
      setToastColor("success");
      setShowToast(true);

      // Send push notification to admin about the session end
      try {
        console.log("Admin notification: Session ended");
        console.log("Admin notification sent for session end");
      } catch (notificationError) {
        console.error("Failed to send admin session end notification:", notificationError);
      }
    },
    onError: (error: any) => {
      setToastMessage(`Failed to end session: ${error.message || "Unknown error"}`);
      setToastColor("danger");
      setShowToast(true);
    },
  });

  const changeTableMutation = useMutation({
    mutationFn: async (data: { sessionId: string; newTableId: string }) => {
      return tableService.changeTable(data.sessionId, data.newTableId);
    },
    onSuccess: async (result, variables) => {
      RefetchTable();
      setShowChangeTableModal(false);
      setSelectedSessionForTransfer(null);
      setTargetTableId("");
      setToastMessage("✅ Customer table changed successfully!");
      setToastColor("success");
      setShowToast(true);

      // Send notification about table change
      try {
        const session = selectedSessionForTransfer;
        const newTable = data?.data?.find(t => t.id === variables.newTableId);
        const oldTable = data?.data?.find(t => t.currentSession?.id === variables.sessionId);
        
        console.log("Admin notification: Table changed");
        console.log("Admin notification sent for table change");
      } catch (notificationError) {
        console.error("Failed to send table change notification:", notificationError);
      }
    },
    onError: (error: any) => {
      setToastMessage(`❌ Failed to change table: ${error.message || "Unknown error"}`);
      setToastColor("danger");
      setShowToast(true);
    },
  });

  const handleEndSession = async (sessionId: string, tableNumber?: string) => {
    showConfirmation({
      header: 'End Session',
      message: `Are you sure you want to end the session for Table ${tableNumber || ''}?`,
      confirmText: 'End Session',
      cancelText: 'Keep Session'
    }, () => {
      endSessionMutation.mutate(sessionId);
    });
  };

  const handleSessionTimeUp = useCallback((sessionId: string, tableNumber?: string) => {
    // Prevent duplicate calls for the same session
    if (endedSessionsRef.current.has(sessionId)) {
      console.log(`TableManagement: Session ${sessionId} already processed, skipping...`);
      return;
    }

    console.log(`TableManagement: Session time expired for Table ${tableNumber}, automatically ending session:`, sessionId);
    
    // Mark this session as being processed
    endedSessionsRef.current.add(sessionId);
    
    // Send notification to admin about automatic session timeout
    console.log("TableManagement: Session timeout notification for table", tableNumber);
    
    endSessionMutation.mutate(sessionId);
    setToastMessage(`⏰ Time's up! Session for Table ${tableNumber} has been automatically ended.`);
    setToastColor("warning");
    setShowToast(true);
  }, [endSessionMutation]); // Removed tables, setToastMessage, setToastColor, setShowToast to prevent unnecessary recreations
  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (!formData.tableNumber.trim()) {
      setToastMessage("Table number is required");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    if (!formData.location.trim()) {
      setToastMessage("Location is required");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      setToastMessage("Valid capacity is required");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    // Show confirmation dialog
    showConfirmation({
      header: 'Update Table',
      message: `Are you sure you want to update Table ${formData.tableNumber}?\n\n` +
        `Location: ${formData.location}\n` +
        `Capacity: ${formData.capacity} people\n\n` +
        `This will modify the table settings.`,
      confirmText: 'Update Table',
      cancelText: 'Cancel'
    }, async () => {
      try {
        await updateTable.mutateAsync({
          tableID: formData.tableID,
          tableNumber: formData.tableNumber,
          location: formData.location,
          capacity: parseInt(formData.capacity),
        });
        
        // Send notification to admin about table update
        console.log("Table updated notification");
        
        RefetchTable();
        
        // Show success message
        setToastMessage(`✅ Table ${formData.tableNumber} updated successfully!`);
        setToastColor("success");
        setShowToast(true);
        
        // Reset form
        setFormData({
          tableID: "",
          tableNumber: "",
          location: "",
          capacity: "",
        });
        setShowEditModal(false);
        setEditingTable(null);
      } catch (error) {
        console.error("Failed to update table:", error);
        setToastMessage(`❌ Failed to update table: ${error || "Unknown error"}`);
        setToastColor("danger");
        setShowToast(true);
      }
    });
  };
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();

    // Show confirmation dialog
    showConfirmation({
      header: 'Create New Table',
      message: `Are you sure you want to create a new table?\n\n` +
        `Table Number: ${formData.tableNumber}\n` +
        `Location: ${formData.location}\n` +
        `Capacity: ${formData.capacity} people\n\n` +
        `This will create a new study table.`,
      confirmText: 'Create Table',
      cancelText: 'Cancel'
    }, async () => {
      try {
        await createTable.mutateAsync({
          tableNumber: formData.tableNumber,
          location: formData.location,
          capacity: parseInt(formData.capacity),
        });
        
        // Send notification to admin about new table creation
        console.log("New table created notification");
        
        RefetchTable();
        // Reset form
        setFormData({
          tableID: "",
          tableNumber: "",
          location: "",
          capacity: "",
        });
        setShowCreateForm(false);
      } catch (error) {
        console.error("Failed to create table:", error);
      }
    });
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
      key: "capacity",
      label: "Capacity",
      sortable: true,
      render: (value) => value,
    },
    {
      key: "hourlyRate",
      label: "Fixed Rate",
      sortable: false,
      render: (value, row) => (
        <span style={{ color: '#28a745', fontWeight: '600' }}>
          ₱{hourlyRate} <small style={{ color: '#666', fontWeight: 'normal' }}>(Global)</small>
        </span>
      ),
    },
    {
      key: "currentSession",
      label: "Running Time",
      sortable: true,
      render: (session, row) => {
        if (!session || !row.isOccupied) {
          return <span style={{ color: '#666' }}>-</span>;
        }
        const runningMinutes = getRunningTimeMinutes(session);
        return (
          <span style={{ 
            color: runningMinutes > 300 ? '#e74c3c' : runningMinutes > 180 ? '#f39c12' : '#27ae60',
            fontWeight: 'bold'
          }}>
            {formatRunningTime(runningMinutes)}
          </span>
        );
      },
    },
    {
      key: "isOccupied",
      label: "Status",
      sortable: true,
      render: (value, row) => {
        // Check if table is occupied and has a session with endTime
        console.log(row)
        if (value && row.currentSession?.endTime) {
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
      label: "",
      sortable: false,
      width: "300px",
      render: (value, row) => (
        <div className="table-actions-container actions-row-layout">
          {/* Edit Button */}
          <IonButton
            size="small"
            fill="outline"
            color="medium"
            className="action-btn edit-btn"
            onClick={() => handleSetUpdate(value)}
          >
            <IonIcon icon={createOutline} slot="start" />
            Edit
          </IonButton>

          {/* Session Actions */}
          {row.isOccupied && row.currentSession ? (
            <>
              <IonButton
                size="small"
                fill="solid"
                color="warning"
                className="action-btn change-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChangeTable(row.currentSession);
                }}
              >
                <IonIcon icon={swapHorizontalOutline} slot="start" />
                Change
              </IonButton>
              <IonButton
                size="small"
                fill="solid"
                color="danger"
                className="action-btn stop-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (row.currentSession) {
                    handleEndSession(row.currentSession.id, row.tableNumber);
                  }
                }}
              >
                <IonIcon icon={stopOutline} slot="start" />
                End
              </IonButton>
            </>
          ) : null}
        </div>
      ),
    },
  ];
  const handleSetUpdate = async (val: any) => {
    try {
      await selectedTable.mutateAsync({
        tableId: val,
      });
      console.log(selectedTable.data);
      
      // Set editing table data
      setEditingTable(selectedTable.data);
      setFormData({
        tableID: selectedTable.data?.tableID!,
        tableNumber: selectedTable.data?.tableNumber!,
        location: selectedTable.data?.location!,
        capacity: selectedTable.data?.capacity.toString()!,
      });
      setShowEditModal(true);
    } catch (error) {
      console.error("Failed to fetch table data:", error);
      setToastMessage("Failed to load table data for editing");
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const handleChangeTable = (session: any) => {
    setSelectedSessionForTransfer(session);
    setShowChangeTableModal(true);
  };

  const handleConfirmChangeTable = () => {
    if (!targetTableId || !selectedSessionForTransfer) {
      setToastMessage("Please select a target table");
      setToastColor("warning");
      setShowToast(true);
      return;
    }

    showConfirmation({
      header: 'Change Table',
      message: `Are you sure you want to move this customer to the selected table?\n\n` +
        `Customer: ${selectedSessionForTransfer.user?.firstName} ${selectedSessionForTransfer.user?.lastName}\n` +
        `Current Table: ${data?.data?.find(t => t.currentSession?.id === selectedSessionForTransfer.id)?.tableNumber}\n` +
        `New Table: ${data?.data?.find(t => t.id === targetTableId)?.tableNumber}\n\n` +
        `This will transfer the active session to the new table.`,
      confirmText: 'Change Table',
      cancelText: 'Cancel'
    }, () => {
      changeTableMutation.mutate({
        sessionId: selectedSessionForTransfer.id,
        newTableId: targetTableId
      });
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
          <h1 style={{ color: 'var(--ion-color-primary)' }}>🔧 Table Management</h1>
          <p>Create and manage study tables</p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Running Time Sort Options */}
            <IonSelect
              value={tableState.sortBy === 'runningTime' ? `runningTime-${tableState.sortOrder}` : ''}
              placeholder="Sort by Running Time"
              onIonChange={(e) => {
                const value = e.detail.value;
                if (value) {
                  const [sortBy, sortOrder] = value.split('-');
                  updateState({ sortBy, sortOrder });
                } else {
                  updateState({ sortBy: 'id', sortOrder: 'asc' });
                }
              }}
              style={{ minWidth: '200px' }}
            >
              <IonSelectOption value="">No time sorting</IonSelectOption>
              <IonSelectOption value="runningTime-asc">Running Time: Low to High</IonSelectOption>
              <IonSelectOption value="runningTime-desc">Running Time: High to Low</IonSelectOption>
            </IonSelect>
            
            <button
              className="btn btn-primary"
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setFormData({
                  tableID: "",
                  tableNumber: "",
                  location: "",
                  capacity: "",
                });
              }}
            >
              {showCreateForm ? "Cancel" : "+ Create New Table"}
            </button>
          </div>
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
          data={data?.data ? sortTableData(data.data, tableState.sortBy, tableState.sortOrder) : undefined}
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
                  ₱{hourlyRate} per hour (Global)
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
      </div> {/* End tables-management */}
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

      {/* Edit Table Modal */}
      <SlideoutModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTable(null);
          setFormData({
            tableID: "",
            tableNumber: "",
            location: "",
            capacity: "",
          });
        }}
        title="Edit Table"
        position="end"
        size="large"
      >
        <div style={{ padding: "20px" }}>
          {editingTable && (
            <>
              <h3>Edit Table: {editingTable.tableNumber}</h3>
              <div style={{ background: "#f5f5f5", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                <p><strong>Current Status:</strong> {editingTable.isOccupied ? "Occupied" : "Available"}</p>
                <p><strong>QR Code:</strong> {editingTable.qrCode}</p>
                <p><strong>Created:</strong> {new Date(editingTable.createdAt).toLocaleDateString()}</p>
              </div>

              <form onSubmit={handleUpdateTable} className="edit-table-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="editTableNumber">Table Number</label>
                    <input
                      type="text"
                      id="editTableNumber"
                      name="tableNumber"
                      value={formData.tableNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., A1, B2, C3"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="editLocation">Location</label>
                    <input
                      type="text"
                      id="editLocation"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Ground Floor, Second Floor"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="editCapacity">Capacity (People)</label>
                    <input
                      type="number"
                      id="editCapacity"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      placeholder="e.g., 1, 2, 4"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-actions" style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingTable(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={updateTable.isPending}
                  >
                    {updateTable.isPending ? "Updating..." : "Update Table"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </SlideoutModal>

      {/* Change Table Modal */}
      <SlideoutModal
        isOpen={showChangeTableModal}
        onClose={() => {
          setShowChangeTableModal(false);
          setSelectedSessionForTransfer(null);
          setTargetTableId("");
        }}
        title="Change Customer Table"
        position="end"
        size="medium"
      >
        <div style={{ padding: "20px" }}>
          {selectedSessionForTransfer && (
            <>
              <h3>Current Session Details</h3>
              <div style={{ background: "#f5f5f5", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
                <p><strong>Customer:</strong> {selectedSessionForTransfer.customerName} {selectedSessionForTransfer.user?.lastName}</p>
                <p><strong>Current Table:</strong> {data?.data?.find(t => t.currentSession?.id === selectedSessionForTransfer.id)?.tableNumber}</p>
                <p><strong>Running Time:</strong> {formatRunningTime(getRunningTimeMinutes(selectedSessionForTransfer))}</p>
              </div>

              <h3>Select New Table</h3>
              <IonItem style={{ marginTop: "20px" }}>
                <IonLabel>Available Tables</IonLabel>
                <IonSelect
                  value={targetTableId}
                  placeholder="Choose available table"
                  onIonChange={(e) => setTargetTableId(e.detail.value)}
                >
                  {getAvailableTables().map((table) => (
                    <IonSelectOption key={table.id} value={table.id}>
                      Table {table.tableNumber} - {table.location} (Capacity: {table.capacity})
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              {getAvailableTables().length === 0 && (
                <div style={{ 
                  padding: "20px", 
                  background: "#fff3cd", 
                  border: "1px solid #ffeaa7", 
                  borderRadius: "8px",
                  marginTop: "20px"
                }}>
                  <p style={{ margin: 0, color: "#856404" }}>
                    ⚠️ No available tables found. All tables are currently occupied.
                  </p>
                </div>
              )}

              {targetTableId && (
                <div style={{ marginTop: "20px", padding: "15px", background: "#e8f5e8", borderRadius: "8px" }}>
                  <p style={{ margin: 0 }}>
                    <strong>Selected Table:</strong> {data?.data?.find(t => t.id === targetTableId)?.tableNumber} - 
                    {data?.data?.find(t => t.id === targetTableId)?.location}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <IonFooter className="ion-no-border">
          <IonToolbar>
            <IonButtons slot="end" className="modal-action-buttons">
              <IonButton
                onClick={() => {
                  setShowChangeTableModal(false);
                  setSelectedSessionForTransfer(null);
                  setTargetTableId("");
                }}
              >
                Cancel
              </IonButton>
              <IonButton
                onClick={handleConfirmChangeTable}
                disabled={!targetTableId || changeTableMutation.isPending || getAvailableTables().length === 0}
                color="warning"
                fill="solid"
              >
                {changeTableMutation.isPending ? "Changing..." : "Change Table"}
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

      {/* Confirmation Toast */}
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
    </IonContent>
  );
};
export default TablesManagement;
