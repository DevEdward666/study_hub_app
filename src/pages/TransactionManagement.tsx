import React, { useState } from "react";
import {
  TransactionManagementServiceAPI,
  useTransactionsManagement,
  useTablesManagement,
  useUsersManagement,
} from "../hooks/AdminDataHooks";
import { useNotifications } from "../hooks/useNotifications";
import { useConfirmation } from "../hooks/useConfirmation";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { useHourlyRate } from "../hooks/GlobalSettingsHooks";
import { useActiveRates } from "../hooks/RateHooks";
import { ConfirmToast } from "../components/common/ConfirmToast";
import "../Admin/styles/admin.css";
import "../Admin/styles/admin-responsive.css";
import DynamicTable, { useTable } from "@/shared/DynamicTable/DynamicTable";
import { GetTransactionWithUserTableColumn } from "@/schema/admin.schema";
import { TableColumn } from "@/shared/DynamicTable/Interface/TableInterface";
import {
  createStatusChip,
  createTableStatusChip,
  formatDate,
} from "@/shared/DynamicTable/Utls/TableUtils";
import { 
  IonButton, 
  IonSegment, 
  IonSegmentButton, 
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonRange,
  IonIcon,
  IonFooter,
  IonToolbar,
  IonButtons,
} from "@ionic/react";
import { PesoFormat } from "@/shared/PesoHelper";
import { useMutation } from "@tanstack/react-query";
import SlideoutModal from "@/shared/SideOutModal/SideoutModalComponent";
import { tableService } from "@/services/table.service";
import { addOutline } from "ionicons/icons";
import PromoSelector from "../components/common/PromoSelector";
const TransactionsManagement: React.FC = () => {
  const { isLoading, error, approve, reject, refetch } =
    useTransactionsManagement();
  const { notifyCreditApproved } = useNotifications();
  const [selectedTab, setSelectedTab] = useState<"pending" | "all">("pending");

  // Get rates from rate management
  const { data: rates, isLoading: isLoadingRates } = useActiveRates();
  
  // Keep hourly rate as fallback for backward compatibility
  const { hourlyRate } = useHourlyRate();

  // Add New Transaction Modal State
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRateId, setSelectedRateId] = useState<string>("");
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);

  // Helper functions to get selected rate data
  const selectedRate = rates?.find(rate => rate.id === selectedRateId);
  const sessionHours = selectedRate?.hours || 1;
  const sessionPrice = selectedRate?.price || hourlyRate;

  // Fetch tables and users for the new transaction modal
  const { tables, isLoading: isLoadingTables, refetch: refetchTables } = useTablesManagement();
  const { users, isLoading: isLoadingUsers } = useUsersManagement();

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async (data: {
      tableId: string;
      userId: string;
      hours: number;
      qrCode: string;
      promoId?: string;
      amount: number;
    }) => {
      return tableService.startSession({
        tableId: data.tableId,
        userId: data.userId,
        hours: data.hours,
        qrCode: data.qrCode, // Use table's QR code for admin-initiated sessions
        promoId: data.promoId,
        amount: data.amount,
      });
    },
    onSuccess: async () => {
      setShowNewTransactionModal(false);
      setSelectedTableId("");
      setSelectedUserId("");
      setSessionHours(1);
      setSelectedPromoId(null);
      setPromoDiscount(0);
      
      // Refresh all data to ensure consistency
      await Promise.all([
        refetchPendingTable(),
        refetchAllTable(),
        refetchTables(),
      ]);
    },
    onError: (error: any) => {
      console.error("Failed to start session:", error);
    },
  });

  // Promo handler
  const handlePromoSelect = (promoId: string | null, discount: number) => {
    setSelectedPromoId(promoId);
    setPromoDiscount(discount);
  };

  // Handle new transaction
  const handleNewTransaction = () => {
    setShowNewTransactionModal(true);
  };

  const handleConfirmNewTransaction = () => {
    if (!selectedUserId) {
      showConfirmation({
        header: 'User Required',
        message: 'Please select a user before starting the session.',
        confirmText: 'OK',
        cancelText: ''
      }, () => {});
      return;
    }
    
    if (!selectedTableId) {
      showConfirmation({
        header: 'Table Required',
        message: 'Please select a table before starting the session.',
        confirmText: 'OK',
        cancelText: ''
      }, () => {});
      return;
    }

    const selectedTable = tables?.find((t: any) => t.id === selectedTableId);
    if (!selectedTable) {
      showConfirmation({
        header: 'Invalid Table',
        message: 'Selected table not found. Please try again.',
        confirmText: 'OK',
        cancelText: ''
      }, () => {});
      return;
    }

    startSessionMutation.mutate({
      tableId: selectedTableId,
      userId: selectedUserId,
      hours: sessionHours,
      qrCode: selectedTable.qrCode,
      promoId: selectedPromoId || undefined,
    amount: sessionPrice, // Use price from selected rate
    });
  };

  // Confirmation hook
  const {
    isOpen: isConfirmOpen,
    options: confirmOptions,
    showConfirmation,
    handleConfirm: confirmAction,
    handleCancel: cancelAction,
    handleDismiss: dismissConfirm
  } = useConfirmation();
  
  const {
    tableState: pendingTableState,
    updateState: updatePendingState,
    data: pendingData,
    isLoading: isLoadingPending,
    isError: isErrorPending,
    error: errorPending,
    refetch: refetchPendingTable,
    isFetching: isFetchingPending,
  } = useTable({
    queryKey: "transactions-pending-table",
    fetchFn: TransactionManagementServiceAPI.fetchTransactions,
    initialState: { pageSize: 10 },
  });

  const {
    tableState: allTableState,
    updateState: updateAllState,
    data: allData,
    isLoading: isLoadingAll,
    isError: isErrorAll,
    error: errorAll,
    refetch: refetchAllTable,
    isFetching: isFetchingAll,
  } = useTable({
    queryKey: "transactions-all-table",
    fetchFn: TransactionManagementServiceAPI.fetchAllTransactions,
    initialState: { pageSize: 10 },
  });
  const handleApprove = async (transactionId: string) => {
    // Find the transaction details to get user info and amount
    const currentData = selectedTab === "pending" ? pendingData : allData;
    const transaction = currentData?.data.find((t: any) => t.id === transactionId);
    
    // Show confirmation dialog
    showConfirmation({
      header: 'Approve Transaction',
      message: `Are you sure you want to approve this credit purchase transaction?\n\n` +
        `Transaction ID: ${transactionId}\n` +
        `User: ${transaction?.user?.name || 'Unknown'}\n` +
        `Amount: ${transaction?.amount || 0} credits\n\n` +
        `This will add credits to the user's account and cannot be undone.`,
      confirmText: 'Approve',
      cancelText: 'Cancel'
    }, async () => {
      try {
        await approve.mutateAsync(transactionId);
        
        // Send notification to user about credit approval
        if (transaction) {
          try {
            // Note: In a real implementation, the API would return the updated balance
            // For now, we'll use the amount as placeholder
            const newBalance = transaction.amount; // This should come from API response
            
            await notifyCreditApproved(
              transaction.user.id,
              transactionId,
              transaction.amount,
              newBalance
            );
          } catch (notifError) {
            console.error("Failed to send approval notification:", notifError);
            // Don't block the approval flow if notification fails
          }
        }
        
        refetchPendingTable();
        refetchAllTable();
      } catch (error) {
        console.error("Failed to approve transaction:", error);
      }
    });
  };

  const handleReject = async (transactionId: string) => {
    // Show confirmation dialog
    showConfirmation({
      header: 'Reject Transaction',
      message: `Are you sure you want to reject this credit purchase transaction?\n\n` +
        `Transaction ID: ${transactionId}\n\n` +
        `This will permanently reject the user's credit purchase request.`,
      confirmText: 'Reject',
      cancelText: 'Cancel'
    }, async () => {
      try {
        await reject.mutateAsync(transactionId);
        refetchPendingTable();
        refetchAllTable();
      } catch (error) {
        console.error("Failed to reject transaction:", error);
      }
    });
  };

  if (isLoading || isLoadingRates) {
    return <LoadingSpinner message={isLoadingRates ? "Loading rates..." : "Loading transactions..."} />;
  }

  if (error) {
    return (
      <ErrorMessage message="Failed to load transactions" onRetry={refetch} />
    );
  }
  const handleRowClick = () => {};
  
  const pendingColumns: TableColumn<GetTransactionWithUserTableColumn>[] = [
    {
      key: "user",
      label: "User",
      sortable: true,
      render: (value) => value.name,
    },
    {
      key: "amount",
      label: "Amount",
      sortable: false,
      render: (value) => PesoFormat(value),
    },
    {
      key: "cost",
      label: "Cost",
      sortable: true,
      render: (value) => PesoFormat(value),
    },
    {
      key: "paymentMethod",
      label: "Payment Method",
      sortable: true,
      render: (value) => value,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value) => createStatusChip(value),
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      key: "id",
      label: "Actions",
      sortable: true,
      render: (value) => (
        <>
          <IonButton
            size="small"
            color={"success"}
            className="slideout-actions-button"
            onClick={() => handleApprove(value)}
          >
            Approve
          </IonButton>
          <IonButton
            size="small"
            color={"danger"}
            className="slideout-actions-button"
            onClick={() => handleReject(value)}
          >
            Reject
          </IonButton>
        </>
      ),
    },
  ];

  const allColumns: TableColumn<GetTransactionWithUserTableColumn>[] = [
    {
      key: "user",
      label: "User",
      sortable: true,
      render: (value) => value.name,
    },
    {
      key: "amount",
      label: "Amount",
      sortable: false,
      render: (value) => PesoFormat(value),
    },
    {
      key: "cost",
      label: "Cost",
      sortable: true,
      render: (value) => PesoFormat(value),
    },
    {
      key: "paymentMethod",
      label: "Payment Method",
      sortable: true,
      render: (value) => value,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value) => createStatusChip(value),
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (value) => formatDate(value),
    },
  ];
  
  const currentData = selectedTab === "pending" ? pendingData : allData;
  const currentColumns = selectedTab === "pending" ? pendingColumns : allColumns;
  const currentTableState = selectedTab === "pending" ? pendingTableState : allTableState;
  const currentUpdateState = selectedTab === "pending" ? updatePendingState : updateAllState;
  const currentIsLoading = selectedTab === "pending" ? isLoadingPending : isLoadingAll;
  const currentIsFetching = selectedTab === "pending" ? isFetchingPending : isFetchingAll;
  const currentIsError = selectedTab === "pending" ? isErrorPending : isErrorAll;
  const currentError = selectedTab === "pending" ? errorPending : errorAll;
  const currentRefetch = selectedTab === "pending" ? refetchPendingTable : refetchAllTable;

  if (isLoading) {
    return <LoadingSpinner message="Loading transactions..." />;
  }

  if (error) {
    return (
      <ErrorMessage message="Failed to load transactions" onRetry={refetch} />
    );
  }
  
  return (
    <div className="transactions-management">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Transaction Management</h1>
            <p>Review credit purchase requests and transaction history</p>
          </div>
          <div className="header-actions">
            <IonButton
              color="primary"
              fill="solid"
              onClick={handleNewTransaction}
            >
              <IonIcon icon={addOutline} slot="start" />
              Add New Transaction
            </IonButton>
          </div>
        </div>
      </div>

      {/* Tab Segment */}
      <div className="transaction-tabs" style={{ marginBottom: '20px' }}>
        <IonSegment
          value={selectedTab}
          onIonChange={(e) => setSelectedTab(e.detail.value as "pending" | "all")}
        >
          <IonSegmentButton value="pending">
            <IonLabel>Pending Transactions</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="all">
            <IonLabel>All Transactions</IonLabel>
          </IonSegmentButton>
        </IonSegment>
      </div>

      {currentData?.data.length === 0 ? (
        <div className="empty-state">
          <h3>{selectedTab === "pending" ? "No pending transactions" : "No transactions found"}</h3>
          <p>{selectedTab === "pending" ? "All transactions have been processed" : "No transaction history available"}</p>
        </div>
      ) : (
        <div className="transactions-table">
          <div className="table-body">
            <DynamicTable
              columns={currentColumns}
              data={currentData?.data}
              total={currentData?.total}
              totalPages={currentData?.totalPages}
              isLoading={currentIsLoading || currentIsFetching}
              isError={currentIsError}
              error={currentError}
              onRefetch={currentRefetch}
              tableState={currentTableState}
              onStateChange={currentUpdateState}
              onRowClick={handleRowClick}
              searchPlaceholder="Search transactions..."
              emptyMessage="No transactions found"
              loadingMessage="Loading transactions..."
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </div>
        </div>
      )}

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

      {/* New Transaction Modal */}
      <SlideoutModal
        isOpen={showNewTransactionModal}
        onClose={() => {
          setShowNewTransactionModal(false);
          setSelectedTableId("");
          setSelectedUserId("");
          setSessionHours(1);
          setSelectedPromoId(null);
          setPromoDiscount(0);
        }}
        title="Add New Transaction"
        position="end"
        size="large"
      >
        <div style={{ padding: "20px" }}>


          <IonItem style={{ marginBottom: "20px" }}>
            <IonLabel>Select User</IonLabel>
            <IonSelect
              value={selectedUserId}
              placeholder="Choose a user"
              onIonChange={(e) => setSelectedUserId(e.detail.value)}
            >
              {users?.map((user: any) => (
                <IonSelectOption key={user.id} value={user.id}>
                  {`${user.name || user.email}`}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <IonItem style={{ marginBottom: "20px" }}>
            <IonLabel>Select Table</IonLabel>
            <IonSelect
              value={selectedTableId}
              placeholder="Choose a table"
              onIonChange={(e) => setSelectedTableId(e.detail.value)}
            >
              {tables?.filter((table: any) => !table.isOccupied).map((table: any) => (
                <IonSelectOption key={table.id} value={table.id}>
                  {table.tableNumber} - {table.location}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem style={{ marginBottom: "20px" }}>
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

          {/* Promo Selection */}
          {/* <div style={{ marginBottom: "20px" }}>
            <PromoSelector
              sessionCost={hourlyRate * sessionHours}
              selectedPromoId={selectedPromoId}
              onPromoSelect={handlePromoSelect}
              disabled={false}
            />
          </div> */}

          <div style={{ padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
            <p><strong>Rate:</strong> ₱{hourlyRate} per hour (Global)</p>
            <p><strong>Subtotal:</strong> ₱{hourlyRate * sessionHours}</p>
            {promoDiscount > 0 && (
              <p style={{ color: "#28a745" }}><strong>Promo Discount:</strong> -₱{promoDiscount}</p>
            )}
            <p><strong>Total Amount:</strong> ₱{(hourlyRate * sessionHours) - promoDiscount}</p>
            <p><strong>End Time:</strong> {new Date(Date.now() + sessionHours * 60 * 60 * 1000).toLocaleString()}</p>
          </div>
        </div>

        <IonFooter className="ion-no-border">
          <IonToolbar>
            <IonButtons slot="end" className="modal-action-buttons">
              <IonButton
                onClick={() => {
                  setShowNewTransactionModal(false);
                  setSelectedTableId("");
                  setSelectedUserId("");
                  setSessionHours(1);
                  setSelectedPromoId(null);
                  setPromoDiscount(0);
                }}
              >
                Cancel
              </IonButton>
              <IonButton
                onClick={handleConfirmNewTransaction}
                disabled={!selectedUserId || !selectedTableId || !selectedRateId || startSessionMutation.isPending || isLoadingRates}
                color="primary"
                fill="solid"
              >
                {startSessionMutation.isPending ? "Starting..." : isLoadingRates ? "Loading Rates..." : "Start Session"}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonFooter>
      </SlideoutModal>
    </div>
  );
};
export default TransactionsManagement;
