import React from 'react';
import { useUsersManagement, useTransactionsManagement } from '../../hooks/AdminDataHooks';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

 const Dashboard: React.FC = () => {
  const { users, isLoading: usersLoading } = useUsersManagement();
  const { transactions, isLoading: transactionsLoading } = useTransactionsManagement();

  const stats = {
    totalUsers: users.length,
    totalCredits: users.reduce((sum, user) => sum + user.credits, 0),
    pendingTransactions: transactions.length,
    activeUsers: users.filter(user => user.hasActiveSession).length,
  };

  if (usersLoading || transactionsLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome to the StudyHub admin panel</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🪙</div>
          <div className="stat-content">
            <h3>{stats.totalCredits}</h3>
            <p>Total Credits</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingTransactions}</h3>
            <p>Pending Transactions</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>{stats.activeUsers}</h3>
            <p>Active Sessions</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h2>Recent Users</h2>
          <div className="users-preview">
            {users.slice(0, 5).map((user) => (
              <div key={user.id} className="user-preview-item">
                <div className="user-info">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <div className="user-stats">
                  <span className="credits">{user.credits} credits</span>
                  {user.isAdmin && <span className="admin-badge">Admin</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h2>Pending Transactions</h2>
          <div className="transactions-preview">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="transaction-preview-item">
                <div className="transaction-info">
                  <strong>{transaction.user.name}</strong>
                  <span>{transaction.amount} credits - ${transaction.cost}</span>
                </div>
                <span className="transaction-date">
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;