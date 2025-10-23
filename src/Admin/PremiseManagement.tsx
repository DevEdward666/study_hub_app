import React, { useRef, useState } from "react";
import {
  PremiseManagementServiceAPI,
  usePremiseManagement,
} from "../hooks/AdminDataHooks";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import QRCode from "react-qr-code";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonItem,
  IonLabel,
  IonRange,
  IonToolbar,
} from "@ionic/react";
import "./styles/admin.css";
import "./styles/admin-responsive.css";
import DynamicTable, { useTable } from "@/shared/DynamicTable/DynamicTable";
import { TableColumn } from "@/shared/DynamicTable/Interface/TableInterface";
import {
  createFinancesChip,
  createTableStatusChip,
  formatDate,
} from "@/shared/DynamicTable/Utls/TableUtils";
import { GetPremiseTableColumn } from "@/schema/premise.schema";
import SlideoutModal from "@/shared/SideOutModal/SideoutModalComponent";
export const PremiseManagement: React.FC = () => {
  const { codes, isLoading, error, createCode, refetch } =
    usePremiseManagement();
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
    fetchFn: PremiseManagementServiceAPI.fetchPremises,
    initialState: { pageSize: 10 },
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [qrSize, setQrSize] = useState<number>(128);
  const [openSelectedRow, setOpenSelectedRow] = useState({
    open: false,
    qr: "",
    location: "",
  });
  const [isExporting, setIsExporting] = useState(false);
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
  const columns: TableColumn<GetPremiseTableColumn>[] = [
    { key: "code", label: "Code", sortable: true },
    { key: "location", label: "Location", sortable: false },
    {
      key: "validityHours",
      label: "Validity Hours",
      sortable: true,
      render: (value) => value,
    },

    {
      key: "isActive",
      label: "Active",
      sortable: true,
      render: (value) => createTableStatusChip(value.toString()),
    },
    // {
    //   key: "id",
    //   label: "Actions",
    //   sortable: true,
    //   render: (value) => (
    //     <IonButton
    //       size="small"
    //       className="slideout-actions-button"
    //       onClick={() => handleSetUpdate(value)}
    //     >
    //       Update
    //     </IonButton>
    //   ),
    // },
  ];
  const handleSetUpdate = (val: any) => {};
  const handleCloseSelectedCollectionModal = () => {
    setOpenSelectedRow({ open: false, qr: "", location: "" });
  };
  const handleRowClick = (val: any) => {
    setOpenSelectedRow({
      open: true,
      qr: val.code,
      location: val.location,
    });
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
            `Table - ${openSelectedRow.location}`,
            totalWidth / 2,
            totalHeight - 25
          );

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `table-${openSelectedRow.qr}-${openSelectedRow.location}-qr.png`;
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
                    setOpenSelectedRow({ open: false, qr: "", location: "" })
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
        {/* Premise Codes List */}
        <div className="premise-codes-grid">
          {/* {codes.map((code) => (
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
          ))} */}
        </div>

        {codes.length === 0 && (
          <div className="empty-state">
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
              <div className="instruction-number">1</div>
              <h4>Create QR Code</h4>
              <p>
                Generate a QR code for each entrance location with specified
                validity duration
              </p>
            </div>

            <div className="instruction-card">
              <div className="instruction-number">2</div>
              <h4>Display QR Code</h4>
              <p>
                Print and display the QR code at the designated entrance
                location
              </p>
            </div>

            <div className="instruction-card">
              <div className="instruction-number">3</div>
              <h4>User Activation</h4>
              <p>
                Students scan the code with their mobile app to gain timed
                access
              </p>
            </div>

            <div className="instruction-card">
              <div className="instruction-number">4</div>
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
