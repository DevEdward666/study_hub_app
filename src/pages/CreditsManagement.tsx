import React, { useState, useMemo } from "react";
import { useHistory } from "react-router-dom";
import {
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonToast,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonCheckbox,
  IonDatetime,
  IonToggle,
} from "@ionic/react";
import {
  addCircleOutline,
  giftOutline,
  pricetagOutline,
  cardOutline,
  flashOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
} from "ionicons/icons";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { ConfirmToast } from "../components/common/ConfirmToast";
import { useConfirmation } from "../hooks/useConfirmation";
import "../Admin/styles/admin.css";
import "../Admin/styles/admin-responsive.css";
import DynamicTable, { useTable } from "@/shared/DynamicTable/DynamicTable";
import { TableColumn } from "@/shared/DynamicTable/Interface/TableInterface";
import { PesoFormat } from "@/shared/PesoHelper";

interface CreditPackage {
  id: string;
  name: string;
  creditAmount: number;
  cost: number;
  type: "basic" | "premium" | "bonus";
  isActive: boolean;
  description?: string;
  createdAt: string;
}

interface Promo {
  id: string;
  name: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
  usedCount: number;
  targetPackages: string[];
  createdAt: string;
}

const CreditsManagement: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<"packages" | "promos">("packages");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const history = useHistory();
  // Package Modal State
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [packageData, setPackageData] = useState({
    name: "",
    creditAmount: 100,
    cost: 50,
    type: "basic" as "basic" | "premium" | "bonus",
    description: "",
    isActive: true,
  });

  // Promo Modal State
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [promoData, setPromoData] = useState({
    name: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 10,
    minPurchase: 100,
    maxDiscount: 50,
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    usageLimit: 100,
    targetPackages: [] as string[],
    isActive: true,
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("success");
  const [packageFormErrors, setPackageFormErrors] = useState<{[key: string]: string}>({});
  const [promoFormErrors, setPromoFormErrors] = useState<{[key: string]: string}>({});

  // Confirmation hook
  const {
    isOpen: isConfirmOpen,
    options: confirmOptions,
    showConfirmation,
    handleConfirm: confirmAction,
    handleCancel: cancelAction,
    handleDismiss: dismissConfirm
  } = useConfirmation();

  // Mock data - replace with actual API calls
  const mockPackages: CreditPackage[] = [
    {
      id: "1",
      name: "Basic 100",
      creditAmount: 100,
      cost: 50,
      type: "basic",
      isActive: true,
      description: "Perfect for casual users",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Premium 250",
      creditAmount: 250,
      cost: 100,
      type: "premium",
      isActive: true,
      description: "Great value for regular users",
      createdAt: new Date().toISOString(),
    },
  ];

  const mockPromos: Promo[] = [
    {
      id: "1",
      name: "New User Discount",
      description: "20% off first purchase",
      discountType: "percentage",
      discountValue: 20,
      minPurchase: 50,
      maxDiscount: 20,
      isActive: true,
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usageLimit: 1000,
      usedCount: 150,
      targetPackages: ["1", "2"],
      createdAt: new Date().toISOString(),
    },
  ];

  // Package Functions
  const validatePackageForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!packageData.name.trim()) {
      errors.name = "Package name is required";
    }
    if (packageData.creditAmount < 1) {
      errors.creditAmount = "Credit amount must be at least 1";
    }
    if (packageData.cost < 0.01) {
      errors.cost = "Cost must be at least 0.01";
    }
    
    setPackageFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePackage = async () => {
    if (!validatePackageForm()) {
      return;
    }

    const action = editingPackage ? "update" : "create";
    showConfirmation({
      header: `${action === "create" ? "Create" : "Update"} Credit Package`,
      message: `Are you sure you want to ${action} this credit package?\n\nName: ${packageData.name}\nCredits: ${packageData.creditAmount}\nCost: ₱${packageData.cost}\nType: ${packageData.type}`,
      confirmText: action === "create" ? "Create Package" : "Update Package",
      cancelText: "Cancel"
    }, async () => {
      await performPackageAction();
    });
  };

  const performPackageAction = async () => {
    try {
      setIsLoading(true);
      
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setToastMessage(`Credit package ${editingPackage ? "updated" : "created"} successfully!`);
      setToastColor("success");
      setShowToast(true);
      setIsPackageModalOpen(false);
      resetPackageForm();
      
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save package";
      setToastMessage(message);
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPackageForm = () => {
    setPackageData({
      name: "",
      creditAmount: 100,
      cost: 50,
      type: "basic",
      description: "",
      isActive: true,
    });
    setEditingPackage(null);
    setPackageFormErrors({});
  };

  const openPackageModal = (pkg?: CreditPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPackageData({
        name: pkg.name,
        creditAmount: pkg.creditAmount,
        cost: pkg.cost,
        type: pkg.type,
        description: pkg.description || "",
        isActive: pkg.isActive,
      });
    } else {
      resetPackageForm();
    }
    setIsPackageModalOpen(true);
  };

  // Promo Functions
  const validatePromoForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!promoData.name.trim()) {
      errors.name = "Promo name is required";
    }
    if (!promoData.description.trim()) {
      errors.description = "Description is required";
    }
    if (promoData.discountValue <= 0) {
      errors.discountValue = "Discount value must be greater than 0";
    }
    if (promoData.discountType === "percentage" && promoData.discountValue > 100) {
      errors.discountValue = "Percentage discount cannot exceed 100%";
    }
    if (promoData.minPurchase < 0) {
      errors.minPurchase = "Minimum purchase cannot be negative";
    }
    if (new Date(promoData.validFrom) >= new Date(promoData.validTo)) {
      errors.validTo = "End date must be after start date";
    }
    
    setPromoFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePromo = async () => {
    if (!validatePromoForm()) {
      return;
    }

    const action = editingPromo ? "update" : "create";
    showConfirmation({
      header: `${action === "create" ? "Create" : "Update"} Promo`,
      message: `Are you sure you want to ${action} this promo?\n\nName: ${promoData.name}\nDiscount: ${promoData.discountValue}${promoData.discountType === "percentage" ? "%" : " ₱"}\nMin Purchase: ₱${promoData.minPurchase}`,
      confirmText: action === "create" ? "Create Promo" : "Update Promo",
      cancelText: "Cancel"
    }, async () => {
      await performPromoAction();
    });
  };

  const performPromoAction = async () => {
    try {
      setIsLoading(true);
      
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setToastMessage(`Promo ${editingPromo ? "updated" : "created"} successfully!`);
      setToastColor("success");
      setShowToast(true);
      setIsPromoModalOpen(false);
      resetPromoForm();
      
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save promo";
      setToastMessage(message);
      setToastColor("danger");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPromoForm = () => {
    setPromoData({
      name: "",
      description: "",
      discountType: "percentage",
      discountValue: 10,
      minPurchase: 100,
      maxDiscount: 50,
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usageLimit: 100,
      targetPackages: [],
      isActive: true,
    });
    setEditingPromo(null);
    setPromoFormErrors({});
  };

  const openPromoModal = (promo?: Promo) => {
    if (promo) {
      setEditingPromo(promo);
      setPromoData({
        name: promo.name,
        description: promo.description,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minPurchase: promo.minPurchase,
        maxDiscount: promo.maxDiscount || 0,
        validFrom: promo.validFrom,
        validTo: promo.validTo,
        usageLimit: promo.usageLimit || 0,
        targetPackages: promo.targetPackages,
        isActive: promo.isActive,
      });
    } else {
      resetPromoForm();
    }
    setIsPromoModalOpen(true);
  };

  // Table Columns
  const packageColumns: TableColumn<CreditPackage>[] = [
    {
      key: "name",
      label: "Package Name",
      sortable: true,
    },
    {
      key: "creditAmount",
      label: "Credits",
      sortable: true,
      render: (value) => `${value} credits`,
    },
    {
      key: "cost",
      label: "Cost",
      sortable: true,
      render: (value) => PesoFormat(value),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (value) => (
        <span className={`status-badge ${value}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (value) => (
        <span className={`status-badge ${value ? 'active' : 'inactive'}`}>
          <IonIcon icon={value ? checkmarkCircleOutline : closeCircleOutline} />
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "id",
      label: "Actions",
      sortable: false,
      render: (value, row) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          <IonButton
            size="small"
            fill="clear"
            color="primary"
            onClick={() => openPackageModal(row)}
            title="Edit Package"
          >
            <IonIcon slot="icon-only" icon={pricetagOutline} />
          </IonButton>
        </div>
      ),
    },
  ];

  const promoColumns: TableColumn<Promo>[] = [
    {
      key: "name",
      label: "Promo Name",
      sortable: true,
    },
    {
      key: "discountValue",
      label: "Discount",
      sortable: true,
      render: (value, row) => `${value}${row.discountType === "percentage" ? "%" : " ₱"}`,
    },
    {
      key: "minPurchase",
      label: "Min Purchase",
      sortable: true,
      render: (value) => PesoFormat(value),
    },
    {
      key: "usedCount",
      label: "Usage",
      sortable: true,
      render: (value, row) => `${value}${row.usageLimit ? `/${row.usageLimit}` : ''}`,
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (value) => (
        <span className={`status-badge ${value ? 'active' : 'inactive'}`}>
          <IonIcon icon={value ? checkmarkCircleOutline : closeCircleOutline} />
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: "validTo",
      label: "Expires",
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: "id",
      label: "Actions",
      sortable: false,
      render: (value, row) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          <IonButton
            size="small"
            fill="clear"
            color="primary"
            onClick={() => openPromoModal(row)}
            title="Edit Promo"
          >
            <IonIcon slot="icon-only" icon={giftOutline} />
          </IonButton>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner message="Loading credits management..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => setError(null)} />;
  }

  return (
    <div className="credits-management">
      <div className="page-header">
        <h1>Credits & Promos Management</h1>
        <p>Manage credit packages and promotional offers</p>
        <div className="header-actions">
          <IonButton
            color="primary"
            onClick={() => selectedTab === "packages" ? openPackageModal() : openPromoModal()}
          >
            <IonIcon icon={selectedTab === "packages" ? cardOutline : giftOutline} slot="start" />
            {selectedTab === "packages" ? "Add Credit Package" : "Add Promo"}
          </IonButton>
        </div>
      </div>

      {/* Tab Segment */}
      <div className="credits-tabs" style={{ marginBottom: '20px' }}>
        <IonSegment
          value={selectedTab}
          onIonChange={(e) => {
            const value = e.detail.value as "packages" | "promos";
            if (value === "promos") {
              history.push('/app/admin/credits/promos');
            } else {
              setSelectedTab(value);
            }
          }}
        >
          <IonSegmentButton value="packages">
            <IonIcon icon={cardOutline} />
            <IonLabel>Credit Packages</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="promos">
            <IonIcon icon={giftOutline} />
            <IonLabel>Promos</IonLabel>
          </IonSegmentButton>
        </IonSegment>
      </div>

      {/* Tables */}
      {selectedTab === "packages" ? (
        <div className="packages-table">
          <DynamicTable
            columns={packageColumns}
            data={mockPackages}
            isLoading={false}
            isError={false}
            error={null}
            onRefetch={() => {}}
            tableState={{ page: 1, pageSize: 10, search: "", sortBy: "", sortOrder: "asc" }}
            onStateChange={() => {}}
            searchPlaceholder="Search credit packages..."
            emptyMessage="No credit packages found"
            loadingMessage="Loading packages..."
          />
        </div>
      ) : (
        <div className="promos-table">
          <DynamicTable
            columns={promoColumns}
            data={mockPromos}
            isLoading={false}
            isError={false}
            error={null}
            onRefetch={() => {}}
            tableState={{ page: 1, pageSize: 10, search: "", sortBy: "", sortOrder: "asc" }}
            onStateChange={() => {}}
            searchPlaceholder="Search promos..."
            emptyMessage="No promos found"
            loadingMessage="Loading promos..."
          />
        </div>
      )}

      {/* Package Modal */}
      <IonModal
        isOpen={isPackageModalOpen}
        onDidDismiss={() => setIsPackageModalOpen(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>{editingPackage ? "Edit" : "Create"} Credit Package</IonTitle>
            <IonButton
              slot="end"
              fill="clear"
              onClick={() => setIsPackageModalOpen(false)}
            >
              Close
            </IonButton>
          </IonToolbar>
        </IonHeader>

        <IonContent className="package-modal-content">
          <div className="package-form">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Package Details</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="form-section">
                  <IonItem className={packageFormErrors.name ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">Package Name *</IonLabel>
                    <IonInput
                      type="text"
                      value={packageData.name}
                      placeholder="e.g., Basic 100"
                      onIonInput={(e) => setPackageData({...packageData, name: e.detail.value!})}
                      required
                    />
                  </IonItem>
                  {packageFormErrors.name && (
                    <IonText color="danger" className="error-text">
                      {packageFormErrors.name}
                    </IonText>
                  )}
                </div>

                <div className="form-section">
                  <IonItem className={packageFormErrors.creditAmount ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">Credit Amount *</IonLabel>
                    <IonInput
                      type="number"
                      value={packageData.creditAmount}
                      placeholder="Enter credit amount"
                      onIonInput={(e) => setPackageData({...packageData, creditAmount: parseInt(e.detail.value!) || 0})}
                      min="1"
                      required
                    />
                  </IonItem>
                  {packageFormErrors.creditAmount && (
                    <IonText color="danger" className="error-text">
                      {packageFormErrors.creditAmount}
                    </IonText>
                  )}
                </div>

                <div className="form-section">
                  <IonItem className={packageFormErrors.cost ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">Cost (₱) *</IonLabel>
                    <IonInput
                      type="number"
                      value={packageData.cost}
                      placeholder="Enter cost in pesos"
                      onIonInput={(e) => setPackageData({...packageData, cost: parseFloat(e.detail.value!) || 0})}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </IonItem>
                  {packageFormErrors.cost && (
                    <IonText color="danger" className="error-text">
                      {packageFormErrors.cost}
                    </IonText>
                  )}
                </div>

                <div className="form-section">
                  <IonItem>
                    <IonLabel position="stacked">Package Type</IonLabel>
                    <IonSelect
                      value={packageData.type}
                      placeholder="Select package type"
                      onIonChange={(e) => setPackageData({...packageData, type: e.detail.value})}
                    >
                      <IonSelectOption value="basic">Basic</IonSelectOption>
                      <IonSelectOption value="premium">Premium</IonSelectOption>
                      <IonSelectOption value="bonus">Bonus</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </div>

                <div className="form-section">
                  <IonItem>
                    <IonLabel position="stacked">Description (Optional)</IonLabel>
                    <IonInput
                      type="text"
                      value={packageData.description}
                      placeholder="Package description"
                      onIonInput={(e) => setPackageData({...packageData, description: e.detail.value!})}
                    />
                  </IonItem>
                </div>

                <div className="form-section">
                  <IonItem>
                    <IonLabel>Active</IonLabel>
                    <IonToggle
                      checked={packageData.isActive}
                      onIonChange={(e) => setPackageData({...packageData, isActive: e.detail.checked})}
                    />
                  </IonItem>
                </div>

                <div className="package-summary" style={{
                  marginTop: "20px",
                  padding: "16px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "8px"
                }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "var(--ion-color-primary)" }}>Package Summary</h4>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}>
                    <span><strong>Name:</strong></span>
                    <span>{packageData.name || "Not set"}</span>
                  </div>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}>
                    <span><strong>Credits:</strong></span>
                    <span>{packageData.creditAmount}</span>
                  </div>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}>
                    <span><strong>Cost:</strong></span>
                    <span>₱{packageData.cost}</span>
                  </div>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}>
                    <span><strong>Rate:</strong></span>
                    <span>₱{packageData.creditAmount ? (packageData.cost / packageData.creditAmount).toFixed(3) : '0'} per credit</span>
                  </div>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between"
                  }}>
                    <span><strong>Status:</strong></span>
                    <span>{packageData.isActive ? "Active" : "Inactive"}</span>
                  </div>
                </div>

                <IonButton
                  expand="block"
                  onClick={handleCreatePackage}
                  disabled={isLoading || !packageData.name || !packageData.creditAmount || !packageData.cost}
                  style={{ marginTop: "20px" }}
                >
                  {isLoading
                    ? `${editingPackage ? "Updating" : "Creating"} Package...`
                    : `${editingPackage ? "Update" : "Create"} Package`}
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonModal>

      {/* Promo Modal */}
      <IonModal
        isOpen={isPromoModalOpen}
        onDidDismiss={() => setIsPromoModalOpen(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>{editingPromo ? "Edit" : "Create"} Promo</IonTitle>
            <IonButton
              slot="end"
              fill="clear"
              onClick={() => setIsPromoModalOpen(false)}
            >
              Close
            </IonButton>
          </IonToolbar>
        </IonHeader>

        <IonContent className="promo-modal-content">
          <div className="promo-form">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Promo Details</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="form-section">
                  <IonItem className={promoFormErrors.name ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">Promo Name *</IonLabel>
                    <IonInput
                      type="text"
                      value={promoData.name}
                      placeholder="e.g., New User Discount"
                      onIonInput={(e) => setPromoData({...promoData, name: e.detail.value!})}
                      required
                    />
                  </IonItem>
                  {promoFormErrors.name && (
                    <IonText color="danger" className="error-text">
                      {promoFormErrors.name}
                    </IonText>
                  )}
                </div>

                <div className="form-section">
                  <IonItem className={promoFormErrors.description ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">Description *</IonLabel>
                    <IonInput
                      type="text"
                      value={promoData.description}
                      placeholder="Describe the promo"
                      onIonInput={(e) => setPromoData({...promoData, description: e.detail.value!})}
                      required
                    />
                  </IonItem>
                  {promoFormErrors.description && (
                    <IonText color="danger" className="error-text">
                      {promoFormErrors.description}
                    </IonText>
                  )}
                </div>

                <div className="form-section">
                  <IonItem>
                    <IonLabel position="stacked">Discount Type</IonLabel>
                    <IonSelect
                      value={promoData.discountType}
                      placeholder="Select discount type"
                      onIonChange={(e) => setPromoData({...promoData, discountType: e.detail.value})}
                    >
                      <IonSelectOption value="percentage">Percentage (%)</IonSelectOption>
                      <IonSelectOption value="fixed">Fixed Amount (₱)</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </div>

                <div className="form-section">
                  <IonItem className={promoFormErrors.discountValue ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">
                      Discount Value {promoData.discountType === "percentage" ? "(%)" : "(₱)"} *
                    </IonLabel>
                    <IonInput
                      type="number"
                      value={promoData.discountValue}
                      placeholder={`Enter ${promoData.discountType === "percentage" ? "percentage" : "amount"}`}
                      onIonInput={(e) => setPromoData({...promoData, discountValue: parseFloat(e.detail.value!) || 0})}
                      min="0.01"
                      max={promoData.discountType === "percentage" ? "100" : undefined}
                      step="0.01"
                      required
                    />
                  </IonItem>
                  {promoFormErrors.discountValue && (
                    <IonText color="danger" className="error-text">
                      {promoFormErrors.discountValue}
                    </IonText>
                  )}
                </div>

                <div className="form-section">
                  <IonItem className={promoFormErrors.minPurchase ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">Minimum Purchase (₱)</IonLabel>
                    <IonInput
                      type="number"
                      value={promoData.minPurchase}
                      placeholder="Minimum purchase amount"
                      onIonInput={(e) => setPromoData({...promoData, minPurchase: parseFloat(e.detail.value!) || 0})}
                      min="0"
                      step="0.01"
                    />
                  </IonItem>
                  {promoFormErrors.minPurchase && (
                    <IonText color="danger" className="error-text">
                      {promoFormErrors.minPurchase}
                    </IonText>
                  )}
                </div>

                {promoData.discountType === "percentage" && (
                  <div className="form-section">
                    <IonItem>
                      <IonLabel position="stacked">Maximum Discount (₱) (Optional)</IonLabel>
                      <IonInput
                        type="number"
                        value={promoData.maxDiscount}
                        placeholder="Maximum discount amount"
                        onIonInput={(e) => setPromoData({...promoData, maxDiscount: parseFloat(e.detail.value!) || 0})}
                        min="0"
                        step="0.01"
                      />
                    </IonItem>
                  </div>
                )}

                <div className="form-section">
                  <IonItem>
                    <IonLabel position="stacked">Usage Limit (Optional)</IonLabel>
                    <IonInput
                      type="number"
                      value={promoData.usageLimit}
                      placeholder="Maximum number of uses"
                      onIonInput={(e) => setPromoData({...promoData, usageLimit: parseInt(e.detail.value!) || 0})}
                      min="1"
                    />
                  </IonItem>
                </div>

                <div className="form-section">
                  <IonItem className={promoFormErrors.validFrom ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">Valid From *</IonLabel>
                    <IonDatetime
                      value={promoData.validFrom}
                      onIonChange={(e) => setPromoData({...promoData, validFrom: e.detail.value as string})}
                      min={new Date().toISOString()}
                    />
                  </IonItem>
                </div>

                <div className="form-section">
                  <IonItem className={promoFormErrors.validTo ? 'ion-invalid' : ''}>
                    <IonLabel position="stacked">Valid Until *</IonLabel>
                    <IonDatetime
                      value={promoData.validTo}
                      onIonChange={(e) => setPromoData({...promoData, validTo: e.detail.value as string})}
                      min={promoData.validFrom}
                    />
                  </IonItem>
                  {promoFormErrors.validTo && (
                    <IonText color="danger" className="error-text">
                      {promoFormErrors.validTo}
                    </IonText>
                  )}
                </div>

                <div className="form-section">
                  <IonItem>
                    <IonLabel>Active</IonLabel>
                    <IonToggle
                      checked={promoData.isActive}
                      onIonChange={(e) => setPromoData({...promoData, isActive: e.detail.checked})}
                    />
                  </IonItem>
                </div>

                <div className="promo-summary" style={{
                  marginTop: "20px",
                  padding: "16px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "8px"
                }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "var(--ion-color-primary)" }}>Promo Summary</h4>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}>
                    <span><strong>Name:</strong></span>
                    <span>{promoData.name || "Not set"}</span>
                  </div>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}>
                    <span><strong>Discount:</strong></span>
                    <span>{promoData.discountValue}{promoData.discountType === "percentage" ? "%" : " ₱"}</span>
                  </div>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}>
                    <span><strong>Min Purchase:</strong></span>
                    <span>₱{promoData.minPurchase}</span>
                  </div>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px"
                  }}>
                    <span><strong>Valid Period:</strong></span>
                    <span>{new Date(promoData.validFrom).toLocaleDateString()} - {new Date(promoData.validTo).toLocaleDateString()}</span>
                  </div>
                  <div className="summary-row" style={{
                    display: "flex",
                    justifyContent: "space-between"
                  }}>
                    <span><strong>Status:</strong></span>
                    <span>{promoData.isActive ? "Active" : "Inactive"}</span>
                  </div>
                </div>

                <IonButton
                  expand="block"
                  onClick={handleCreatePromo}
                  disabled={isLoading || !promoData.name || !promoData.description}
                  style={{ marginTop: "20px" }}
                >
                  {isLoading
                    ? `${editingPromo ? "Updating" : "Creating"} Promo...`
                    : `${editingPromo ? "Update" : "Create"} Promo`}
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonModal>

      {/* Toast for notifications */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={toastColor}
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
    </div>
  );
};

export default CreditsManagement;