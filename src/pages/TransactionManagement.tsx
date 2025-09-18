import React from "react";
import { useTransactionsManagement } from "../hooks/AdminDataHooks";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import "../Admin/styles/admin.css";
const TransactionsManagement: React.FC = () => {
  const { transactions, isLoading, error, approve, reject, refetch } =
    useTransactionsManagement();

  const handleApprove = async (transactionId: string) => {
    try {
      await approve.mutateAsync(transactionId);
    } catch (error) {
      console.error("Failed to approve transaction:", error);
    }
  };

  const handleReject = async (transactionId: string) => {
    try {
      await reject.mutateAsync(transactionId);
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

  return (
    <div className="transactions-management">
      <div className="page-header">
        <h1>Transaction Management</h1>
        <p>Review and approve credit purchase requests</p>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <h3>No pending transactions</h3>
          <p>All transactions have been processed</p>
        </div>
      ) : (
        <div className="transactions-table">
          <div className="table-header">
            <div className="col-user">User</div>
            <div className="col-amount">Amount</div>
            <div className="col-cost">Cost</div>
            <div className="col-method">Payment Method</div>
            <div className="col-date">Date</div>
            <div className="col-actions">Actions</div>
          </div>

          <div className="table-body">
            {transactions.map((transaction) => (
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default TransactionsManagement;
