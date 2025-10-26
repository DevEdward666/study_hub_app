import React, { useState } from "react";
import {
  TransactionManagementServiceAPI,
  useTransactionsManagement,
} from "../hooks/AdminDataHooks";
import { useNotifications } from "../hooks/useNotifications";
import { useConfirmation } from "../hooks/useConfirmation";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
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
import { IonButton, IonSegment, IonSegmentButton, IonLabel } from "@ionic/react";
import { PesoFormat } from "@/shared/PesoHelper";
const TransactionsManagement: React.FC = () => {
  const { isLoading, error, approve, reject, refetch } =
    useTransactionsManagement();
  const { notifyCreditApproved } = useNotifications();
  const [selectedTab, setSelectedTab] = useState<"pending" | "all">("pending");

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

  if (isLoading) {
    return <LoadingSpinner message="Loading transactions..." />;
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
        <h1>Transaction Management</h1>
        <p>Review credit purchase requests and transaction history</p>
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
    </div>
  );
};
export default TransactionsManagement;
