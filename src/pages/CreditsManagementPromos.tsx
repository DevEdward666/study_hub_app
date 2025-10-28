import React, { useState } from "react";
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
  IonText,
  IonSegment,
  IonSegmentButton,
  IonDatetime,
  IonToggle,
  IonBadge,
  IonChip,
} from "@ionic/react";
import {
  addCircleOutline,
  giftOutline,
  cardOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  statsChartOutline,
  calendarOutline,
  personOutline,
  trendingUpOutline,
} from "ionicons/icons";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { ConfirmToast } from "../components/common/ConfirmToast";
import { useConfirmation } from "../hooks/useConfirmation";
import "../Admin/styles/admin.css";
import "../Admin/styles/admin-responsive.css";
import DynamicTable from "@/shared/DynamicTable/DynamicTable";
import { TableColumn } from "@/shared/DynamicTable/Interface/TableInterface";
import { PesoFormat } from "@/shared/PesoHelper";
import {
  useAdminPromos,
  useCreatePromo,
  useUpdatePromo,
  useDeletePromo,
  useTogglePromoStatus,
  usePromoStatistics,
  usePromoHelpers,
} from "../hooks/useAdminPromo";
import {
  PromoDto,
  PromoType,
  PromoStatus,
  CreatePromoRequest,
  UpdatePromoRequest,
} from "../schema/promo.schema";

const CreditsManagementPromos: React.FC = () => {

  const history = useHistory();
  const [selectedTab, setSelectedTab] = useState<"promos" | "statistics">("promos");
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoDto | null>(null);
  const [selectedPromoForStats, setSelectedPromoForStats] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  // Promo Form State
  const [promoData, setPromoData] = useState<Partial<CreatePromoRequest>>({
    code: "",
    name: "",
    description: "",
    type: PromoType.Percentage,
    percentageBonus: 20,
    minPurchaseAmount: 100,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const [promoFormErrors, setPromoFormErrors] = useState<{ [key: string]: string }>({});

  // Hooks
  const { data: promos, isLoading, isError, error, refetch } = useAdminPromos(includeInactive);
  const createPromoMutation = useCreatePromo();
  const updatePromoMutation = useUpdatePromo();
  const deletePromoMutation = useDeletePromo();
  const toggleStatusMutation = useTogglePromoStatus();
  const { formatPromoDiscount, getStatusColor, isPromoValid, calculateBonusAmount } = usePromoHelpers();

  const { data: selectedPromoStats } = usePromoStatistics(
    selectedPromoForStats || "",
    !!selectedPromoForStats
  );

  // Confirmation hook
  const {
    isOpen: isConfirmOpen,
    options: confirmOptions,
    showConfirmation,
    handleConfirm: confirmAction,
    handleCancel: cancelAction,
    handleDismiss: dismissConfirm,
  } = useConfirmation();

  // Validation
  const validatePromoForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!promoData.code?.trim()) {
      errors.code = "Promo code is required";
    } else if (promoData.code.length > 50) {
      errors.code = "Code must be 50 characters or less";
    }

    if (!promoData.name?.trim()) {
      errors.name = "Promo name is required";
    }

    switch (promoData.type) {
      case PromoType.Percentage:
        if (!promoData.percentageBonus || promoData.percentageBonus <= 0) {
          errors.percentageBonus = "Percentage bonus is required";
        } else if (promoData.percentageBonus > 100) {
          errors.percentageBonus = "Percentage cannot exceed 100%";
        }
        break;

      case PromoType.FixedAmount:
        if (!promoData.fixedBonusAmount || promoData.fixedBonusAmount <= 0) {
          errors.fixedBonusAmount = "Fixed bonus amount is required";
        }
        break;

      case PromoType.BuyXGetY:
        if (!promoData.buyAmount || promoData.buyAmount <= 0) {
          errors.buyAmount = "Buy amount is required";
        }
        if (!promoData.getAmount || promoData.getAmount <= 0) {
          errors.getAmount = "Get amount is required";
        }
        break;
    }

    if (promoData.startDate && promoData.endDate) {
      if (new Date(promoData.startDate) >= new Date(promoData.endDate)) {
        errors.endDate = "End date must be after start date";
      }
    }

    setPromoFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handlers
  const handleCreateOrUpdatePromo = async () => {
    if (!validatePromoForm()) {
      return;
    }

    const action = editingPromo ? "update" : "create";
    const displayInfo = `Code: ${promoData.code}\nName: ${promoData.name}\nType: ${promoData.type}`;

    showConfirmation(
      {
        header: `${action === "create" ? "Create" : "Update"} Promo`,
        message: `Are you sure you want to ${action} this promo?\n\n${displayInfo}`,
        confirmText: action === "create" ? "Create Promo" : "Update Promo",
        cancelText: "Cancel",
      },
      async () => {
        await performPromoAction();
      }
    );
  };

  const performPromoAction = async () => {
    try {
      if (editingPromo) {
        await updatePromoMutation.mutateAsync({
          promoId: editingPromo.id,
          ...promoData,
        } as UpdatePromoRequest);
      } else {
        await createPromoMutation.mutateAsync(promoData as CreatePromoRequest);
      }

      setIsPromoModalOpen(false);
      resetPromoForm();
    } catch (error) {
      console.error("Failed to save promo:", error);
    }
  };

  const handleDeletePromo = (promo: PromoDto) => {
    showConfirmation(
      {
        header: "Delete Promo",
        message: `Are you sure you want to delete "${promo.name}"?\n\nThis action cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
      },
      async () => {
        await deletePromoMutation.mutateAsync(promo.id);
      }
    );
  };

  const handleToggleStatus = (promo: PromoDto, newStatus: PromoStatus) => {
    showConfirmation(
      {
        header: "Change Promo Status",
        message: `Change "${promo.name}" status to ${newStatus}?`,
        confirmText: "Confirm",
        cancelText: "Cancel",
      },
      async () => {
        await toggleStatusMutation.mutateAsync({
          promoId: promo.id,
          status: newStatus,
        });
      }
    );
  };

  const resetPromoForm = () => {
    setPromoData({
      code: "",
      name: "",
      description: "",
      type: PromoType.Percentage,
      percentageBonus: 20,
      minPurchaseAmount: 100,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    setEditingPromo(null);
    setPromoFormErrors({});
  };

  const openPromoModal = (promo?: PromoDto) => {
    if (promo) {
      setEditingPromo(promo);
      setPromoData({
        code: promo.code,
        name: promo.name,
        description: promo.description || "",
        type: promo.type,
        percentageBonus: promo.percentageBonus || undefined,
        fixedBonusAmount: promo.fixedBonusAmount || undefined,
        buyAmount: promo.buyAmount || undefined,
        getAmount: promo.getAmount || undefined,
        minPurchaseAmount: promo.minPurchaseAmount || undefined,
        maxDiscountAmount: promo.maxDiscountAmount || undefined,
        usageLimit: promo.usageLimit || undefined,
        usagePerUser: promo.usagePerUser || undefined,
        startDate: promo.startDate || undefined,
        endDate: promo.endDate || undefined,
      });
    } else {
      resetPromoForm();
    }
    setIsPromoModalOpen(true);
  };

  // Table Columns
  const promoColumns: TableColumn<PromoDto>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (value) => (
        <span style={{ fontFamily: "monospace", fontWeight: "600" }}>{value}</span>
      ),
    },
    {
      key: "name",
      label: "Promo Name",
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (value, row) => (
        <IonChip color="primary">
          <IonLabel>{formatPromoDiscount(row)}</IonLabel>
        </IonChip>
      ),
    },
    {
      key: "minPurchaseAmount",
      label: "Min Purchase",
      sortable: true,
      render: (value) => (value ? PesoFormat(value) : "None"),
    },
    {
      key: "currentUsageCount",
      label: "Usage",
      sortable: true,
      render: (value, row) => `${value}${row.usageLimit ? `/${row.usageLimit}` : ""}`,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value) => (
        <IonBadge color={getStatusColor(value)}>
          <IonIcon
            icon={value === PromoStatus.Active ? checkmarkCircleOutline : closeCircleOutline}
            style={{ marginRight: "4px" }}
          />
          {value}
        </IonBadge>
      ),
    },
    {
      key: "endDate",
      label: "Expires",
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : "No expiry"),
    },
    {
      key: "id",
      label: "Actions",
      sortable: false,
      render: (value, row) => (
        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
          <IonButton size="small" fill="clear" color="primary" onClick={() => openPromoModal(row)}>
            Edit
          </IonButton>
          <IonButton
            size="small"
            fill="clear"
            color="warning"
            onClick={() =>
              handleToggleStatus(
                row,
                row.status === PromoStatus.Active ? PromoStatus.Inactive : PromoStatus.Active
              )
            }
          >
            {row.status === PromoStatus.Active ? "Deactivate" : "Activate"}
          </IonButton>
          <IonButton
            size="small"
            fill="clear"
            color="tertiary"
            onClick={() => setSelectedPromoForStats(row.id)}
          >
            <IonIcon icon={statsChartOutline} />
          </IonButton>
          <IonButton size="small" fill="clear" color="danger" onClick={() => handleDeletePromo(row)}>
            Delete
          </IonButton>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner message="Loading promos..." />;
  }

  if (isError) {
    return <ErrorMessage message={error?.message || "Failed to load promos"} onRetry={refetch} />;
  }

  return (
    <div className="credits-management">
      <div className="page-header">
        <h1>Promo Management</h1>
        <p>Create and manage promotional offers for credits</p>
        <div className="header-actions">
          <IonButton color="primary" onClick={() => openPromoModal()}>
            <IonIcon icon={giftOutline} slot="start" />
            Create New Promo
          </IonButton>
          <IonButton fill="outline" onClick={() => setIncludeInactive(!includeInactive)}>
            {includeInactive ? "Hide Inactive" : "Show Inactive"}
          </IonButton>
        </div>

        {/* Tab Segment for Packages/Promos Navigation */}
        <div className="credits-tabs" style={{ marginBottom: '20px' }}>
          <IonSegment
            value="promos"
            onIonChange={(e) => {
              const value = e.detail.value;
              if (value === "packages") {
                history.push('/app/admin/credits');
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
      </div>

      {/* Promos Table */}
      <div className="promos-table">
        <DynamicTable
          columns={promoColumns}
          data={promos || []}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRefetch={refetch}
          tableState={{ page: 1, pageSize: 10, search: "", sortBy: "", sortOrder: "asc" }}
          onStateChange={() => {}}
          searchPlaceholder="Search promos by code or name..."
          emptyMessage="No promos found. Create your first promo to get started!"
          loadingMessage="Loading promos..."
        />
      </div>

      {/* Promo Modal */}
      <IonModal
        isOpen={isPromoModalOpen}
        onDidDismiss={() => setIsPromoModalOpen(false)}
        className="promo-modal"
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>{editingPromo ? "Edit Promo" : "Create New Promo"}</IonTitle>
            <IonButton slot="end" fill="clear" onClick={() => setIsPromoModalOpen(false)}>
              Close
            </IonButton>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          <div className="promo-form" style={{ padding: "16px" }}>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Promo Details</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {/* Promo Code */}
                <div className="form-section">
                  <IonItem className={promoFormErrors.code ? "ion-invalid" : ""}>
                    <IonLabel position="stacked">Promo Code *</IonLabel>
                    <IonInput
                      type="text"
                      value={promoData.code}
                      placeholder="e.g., WELCOME20"
                      onIonInput={(e) => setPromoData({ ...promoData, code: e.detail.value! })}
                      disabled={!!editingPromo}
                      required
                    />
                  </IonItem>
                  {promoFormErrors.code && (
                    <IonText color="danger">
                      <small>{promoFormErrors.code}</small>
                    </IonText>
                  )}
                </div>

                {/* Promo Name */}
                <div className="form-section">
                  <IonItem className={promoFormErrors.name ? "ion-invalid" : ""}>
                    <IonLabel position="stacked">Promo Name *</IonLabel>
                    <IonInput
                      type="text"
                      value={promoData.name}
                      placeholder="e.g., Welcome Bonus"
                      onIonInput={(e) => setPromoData({ ...promoData, name: e.detail.value! })}
                      required
                    />
                  </IonItem>
                  {promoFormErrors.name && (
                    <IonText color="danger">
                      <small>{promoFormErrors.name}</small>
                    </IonText>
                  )}
                </div>

                {/* Description */}
                <div className="form-section">
                  <IonItem>
                    <IonLabel position="stacked">Description</IonLabel>
                    <IonInput
                      type="text"
                      value={promoData.description}
                      placeholder="Describe the promo..."
                      onIonInput={(e) => setPromoData({ ...promoData, description: e.detail.value! })}
                    />
                  </IonItem>
                </div>

                {/* Promo Type */}
                <div className="form-section">
                  <IonItem>
                    <IonLabel position="stacked">Promo Type *</IonLabel>
                    <IonSelect
                      value={promoData.type}
                      onIonChange={(e) => setPromoData({ ...promoData, type: e.detail.value })}
                    >
                      <IonSelectOption value={PromoType.Percentage}>
                        Percentage Bonus
                      </IonSelectOption>
                      <IonSelectOption value={PromoType.FixedAmount}>
                        Fixed Amount Bonus
                      </IonSelectOption>
                      <IonSelectOption value={PromoType.BuyXGetY}>Buy X Get Y</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </div>

                {/* Type-specific fields */}
                {promoData.type === PromoType.Percentage && (
                  <>
                    <div className="form-section">
                      <IonItem className={promoFormErrors.percentageBonus ? "ion-invalid" : ""}>
                        <IonLabel position="stacked">Percentage Bonus (%) *</IonLabel>
                        <IonInput
                          type="number"
                          value={promoData.percentageBonus}
                          min="0"
                          max="100"
                          onIonInput={(e) =>
                            setPromoData({
                              ...promoData,
                              percentageBonus: parseFloat(e.detail.value!) || 0,
                            })
                          }
                        />
                      </IonItem>
                      {promoFormErrors.percentageBonus && (
                        <IonText color="danger">
                          <small>{promoFormErrors.percentageBonus}</small>
                        </IonText>
                      )}
                    </div>
                    <div className="form-section">
                      <IonItem>
                        <IonLabel position="stacked">Max Discount Amount</IonLabel>
                        <IonInput
                          type="number"
                          value={promoData.maxDiscountAmount}
                          min="0"
                          placeholder="Optional cap"
                          onIonInput={(e) =>
                            setPromoData({
                              ...promoData,
                              maxDiscountAmount: parseFloat(e.detail.value!) || undefined,
                            })
                          }
                        />
                      </IonItem>
                    </div>
                  </>
                )}

                {promoData.type === PromoType.FixedAmount && (
                  <div className="form-section">
                    <IonItem className={promoFormErrors.fixedBonusAmount ? "ion-invalid" : ""}>
                      <IonLabel position="stacked">Fixed Bonus Amount *</IonLabel>
                      <IonInput
                        type="number"
                        value={promoData.fixedBonusAmount}
                        min="0"
                        onIonInput={(e) =>
                          setPromoData({
                            ...promoData,
                            fixedBonusAmount: parseFloat(e.detail.value!) || 0,
                          })
                        }
                      />
                    </IonItem>
                    {promoFormErrors.fixedBonusAmount && (
                      <IonText color="danger">
                        <small>{promoFormErrors.fixedBonusAmount}</small>
                      </IonText>
                    )}
                  </div>
                )}

                {promoData.type === PromoType.BuyXGetY && (
                  <>
                    <div className="form-section">
                      <IonItem className={promoFormErrors.buyAmount ? "ion-invalid" : ""}>
                        <IonLabel position="stacked">Buy Amount *</IonLabel>
                        <IonInput
                          type="number"
                          value={promoData.buyAmount}
                          min="0"
                          onIonInput={(e) =>
                            setPromoData({
                              ...promoData,
                              buyAmount: parseFloat(e.detail.value!) || 0,
                            })
                          }
                        />
                      </IonItem>
                      {promoFormErrors.buyAmount && (
                        <IonText color="danger">
                          <small>{promoFormErrors.buyAmount}</small>
                        </IonText>
                      )}
                    </div>
                    <div className="form-section">
                      <IonItem className={promoFormErrors.getAmount ? "ion-invalid" : ""}>
                        <IonLabel position="stacked">Get Amount *</IonLabel>
                        <IonInput
                          type="number"
                          value={promoData.getAmount}
                          min="0"
                          onIonInput={(e) =>
                            setPromoData({
                              ...promoData,
                              getAmount: parseFloat(e.detail.value!) || 0,
                            })
                          }
                        />
                      </IonItem>
                      {promoFormErrors.getAmount && (
                        <IonText color="danger">
                          <small>{promoFormErrors.getAmount}</small>
                        </IonText>
                      )}
                    </div>
                  </>
                )}

                {/* Min Purchase Amount */}
                <div className="form-section">
                  <IonItem>
                    <IonLabel position="stacked">Minimum Purchase Amount</IonLabel>
                    <IonInput
                      type="number"
                      value={promoData.minPurchaseAmount}
                      min="0"
                      placeholder="Optional"
                      onIonInput={(e) =>
                        setPromoData({
                          ...promoData,
                          minPurchaseAmount: parseFloat(e.detail.value!) || undefined,
                        })
                      }
                    />
                  </IonItem>
                </div>

                {/* Usage Limits */}
                <div className="form-section">
                  <IonItem>
                    <IonLabel position="stacked">Total Usage Limit</IonLabel>
                    <IonInput
                      type="number"
                      value={promoData.usageLimit}
                      min="1"
                      placeholder="Optional"
                      onIonInput={(e) =>
                        setPromoData({
                          ...promoData,
                          usageLimit: parseInt(e.detail.value!) || undefined,
                        })
                      }
                    />
                  </IonItem>
                </div>

                <div className="form-section">
                  <IonItem>
                    <IonLabel position="stacked">Usage Per User</IonLabel>
                    <IonInput
                      type="number"
                      value={promoData.usagePerUser}
                      min="1"
                      placeholder="Optional"
                      onIonInput={(e) =>
                        setPromoData({
                          ...promoData,
                          usagePerUser: parseInt(e.detail.value!) || undefined,
                        })
                      }
                    />
                  </IonItem>
                </div>

                {/* Date Range */}
                <div className="form-section">
                  <IonItem>
                    <IonLabel position="stacked">Start Date</IonLabel>
                    <IonDatetime
                      value={promoData.startDate}
                      onIonChange={(e) =>
                        setPromoData({ ...promoData, startDate: e.detail.value as string })
                      }
                      presentation="date"
                    />
                  </IonItem>
                </div>

                <div className="form-section">
                  <IonItem className={promoFormErrors.endDate ? "ion-invalid" : ""}>
                    <IonLabel position="stacked">End Date</IonLabel>
                    <IonDatetime
                      value={promoData.endDate}
                      onIonChange={(e) =>
                        setPromoData({ ...promoData, endDate: e.detail.value as string })
                      }
                      presentation="date"
                    />
                  </IonItem>
                  {promoFormErrors.endDate && (
                    <IonText color="danger">
                      <small>{promoFormErrors.endDate}</small>
                    </IonText>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ marginTop: "24px", display: "flex", gap: "8px" }}>
                  <IonButton
                    expand="block"
                    onClick={handleCreateOrUpdatePromo}
                    disabled={
                      createPromoMutation.isPending || updatePromoMutation.isPending
                    }
                  >
                    {editingPromo ? "Update Promo" : "Create Promo"}
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={() => setIsPromoModalOpen(false)}
                  >
                    Cancel
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonModal>

      {/* Statistics Modal */}
      <IonModal
        isOpen={!!selectedPromoForStats}
        onDidDismiss={() => setSelectedPromoForStats(null)}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Promo Statistics</IonTitle>
            <IonButton slot="end" fill="clear" onClick={() => setSelectedPromoForStats(null)}>
              Close
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {selectedPromoStats && (
            <div style={{ padding: "16px" }}>
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>{selectedPromoStats.name}</IonCardTitle>
                  <p>Code: {selectedPromoStats.code}</p>
                </IonCardHeader>
                <IonCardContent>
                  <div style={{ display: "grid", gap: "16px" }}>
                    <div>
                      <IonLabel color="medium">Total Usage</IonLabel>
                      <h2>{selectedPromoStats.totalUsageCount}</h2>
                    </div>
                    <div>
                      <IonLabel color="medium">Unique Users</IonLabel>
                      <h2>{selectedPromoStats.uniqueUsersCount}</h2>
                    </div>
                    <div>
                      <IonLabel color="medium">Total Bonus Given</IonLabel>
                      <h2>{selectedPromoStats.totalBonusGiven} credits</h2>
                    </div>
                    <div>
                      <IonLabel color="medium">Total Purchase Amount</IonLabel>
                      <h2>{PesoFormat(selectedPromoStats.totalPurchaseAmount)}</h2>
                    </div>
                    {selectedPromoStats.lastUsedAt && (
                      <div>
                        <IonLabel color="medium">Last Used</IonLabel>
                        <p>{new Date(selectedPromoStats.lastUsedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          )}
        </IonContent>
      </IonModal>

      {/* Confirmation Toast */}
      <ConfirmToast
        isOpen={isConfirmOpen}
        header={confirmOptions.header}
        message={confirmOptions.message}
        confirmText={confirmOptions.confirmText}
        cancelText={confirmOptions.cancelText}
        onConfirm={confirmAction}
        onCancel={cancelAction}
        onDidDismiss={dismissConfirm}
      />
    </div>
  );
};

export default CreditsManagementPromos;

