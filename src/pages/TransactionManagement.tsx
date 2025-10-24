import React from "react";
import {
  TransactionManagementServiceAPI,
  useTransactionsManagement,
} from "../hooks/AdminDataHooks";
import { useNotifications } from "../hooks/useNotifications";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
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
import { IonButton } from "@ionic/react";
import { PesoFormat } from "@/shared/PesoHelper";
const TransactionsManagement: React.FC = () => {
  const { isLoading, error, approve, reject, refetch } =
    useTransactionsManagement();
  const { notifyCreditApproved } = useNotifications();
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
    queryKey: "transactions-table",
    fetchFn: TransactionManagementServiceAPI.fetchTransactions,
    initialState: { pageSize: 10 },
  });
  const handleApprove = async (transactionId: string) => {
    // Find the transaction details to get user info and amount
    const transaction = data?.data.find(t => t.id === transactionId);
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to approve this credit purchase transaction?\n\n` +
      `Transaction ID: ${transactionId}\n` +
      `User: ${transaction?.user?.name || 'Unknown'}\n` +
      `Amount: ${transaction?.amount || 0} credits\n\n` +
      `This will add credits to the user's account and cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }

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
      
      RefetchTable();
    } catch (error) {
      console.error("Failed to approve transaction:", error);
    }
  };

  const handleReject = async (transactionId: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to reject this credit purchase transaction?\n\n` +
      `Transaction ID: ${transactionId}\n\n` +
      `This will permanently reject the user's credit purchase request.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      await reject.mutateAsync(transactionId);
      RefetchTable();
    } catch (error) {
      console.error("Failed to reject transaction:", error);
    }
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
  const columns: TableColumn<GetTransactionWithUserTableColumn>[] = [
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
  return (
    <div className="transactions-management">
      <div className="page-header">
        <h1>Transaction Management</h1>
        <p>Review and approve credit purchase requests</p>
      </div>

      {data?.data.length === 0 ? (
        <div className="empty-state">
          <h3>No pending transactions</h3>
          <p>All transactions have been processed</p>
        </div>
      ) : (
        <div className="transactions-table">
          <div className="table-body">
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
            {/* {transactions.map((transaction) => (
              <div key={transaction.id} className="table-row">
                <div className="col-user">
                  <div className="user-cell">
                    <strong>{transaction.user.name}</strong>
                    <span>{transaction.user.email}</span>
                  </div>
                </div>
                <div className="col-amount">
                  <span className="amount">{transaction.amount} credits</span>
                </div>
                <div className="col-cost">
                  <span className="cost">${transaction.cost.toFixed(2)}</span>
                </div>
                <div className="col-method">
                  <span className="method">
                    {transaction.paymentMethod.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <div className="col-date">
                  <span className="date">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="col-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => handleApprove(transaction.id)}
                    disabled={approve.isPending || reject.isPending}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleReject(transaction.id)}
                    disabled={approve.isPending || reject.isPending}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))} */}
          </div>
        </div>
      )}
    </div>
  );
};
export default TransactionsManagement;
