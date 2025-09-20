import React, { useRef, useState } from "react";
import {
  PremiseManagementServiceAPI,
  TableManagementServiceAPI,
  useTablesManagement,
} from "../hooks/AdminDataHooks";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import "../Admin/styles/admin.css";
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
} from "@ionic/react";
import { createTableStatusChip } from "@/shared/DynamicTable/Utls/TableUtils";
import SlideoutModal from "@/shared/SideOutModal/SideoutModalComponent";
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [qrSize, setQrSize] = useState<number>(128);
  const [openSelectedRow, setOpenSelectedRow] = useState({
    open: false,
    qr: "",
    tableName: "",
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    tableID: "",
    tableNumber: "",
    hourlyRate: "",
    location: "",
    capacity: "",
  });
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
      label: "Occupied?",
      sortable: true,
      render: (value) => createTableStatusChip(value.toString()),
    },
    {
      key: "id",
      label: "Actions",
      sortable: true,
      render: (value) => (
        <>
          <IonButton
            size="small"
            color={"secondary"}
            className="slideout-actions-button"
            onClick={() => handleSetUpdate(value)}
          >
            Update
          </IonButton>
        </>
      ),
    },
    // {
    //   key: "qrCode",
    //   label: "QR",
    //   sortable: true,
    //   render: (value) => <QRCode value={value} />,
    // },
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
        title={`QR`}
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
    </IonContent>
  );
};
export default TablesManagement;
