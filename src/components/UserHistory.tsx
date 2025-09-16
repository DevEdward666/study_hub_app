import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function UserHistory() {
  const sessions = useQuery(api.credits.getUserSessions);
  const transactions = useQuery(api.credits.getUserTransactions);

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = (endTime || Date.now()) - startTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Your History</h2>
        <p className="text-gray-600">View your past sessions and transactions</p>
      </div>

      {/* Study Sessions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Study Sessions</h3>
        <div className="space-y-3">
          {sessions?.slice(0, 10).map((session) => (
            <div
              key={session._id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">
                  Table {session.table?.tableNumber} - {session.table?.location}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(session.startTime).toLocaleDateString()} at{" "}
                  {new Date(session.startTime).toLocaleTimeString()}
                </p>
                <p className="text-sm text-gray-500">
                  Duration: {formatDuration(session.startTime, session.endTime)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">
                  {session.creditsUsed} credits
                </p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs ${
                    session.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {session.status}
                </span>
              </div>
            </div>
          ))}
          {!sessions?.length && (
            <p className="text-gray-500 text-center py-8">No study sessions yet</p>
          )}
        </div>
      </div>

      {/* Credit Transactions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Credit Purchases</h3>
        <div className="space-y-3">
          {transactions?.slice(0, 10).map((transaction) => (
            <div
              key={transaction._id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">{transaction.amount} credits</p>
                <p className="text-sm text-gray-600">
                  {new Date(transaction._creationTime).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Payment: {transaction.paymentMethod}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${transaction.cost.toFixed(2)}</p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs ${
                    transaction.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : transaction.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {transaction.status}
                </span>
              </div>
            </div>
          ))}
          {!transactions?.length && (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            {sessions?.filter(s => s.status === "completed").length || 0}
          </p>
          <p className="text-sm text-gray-600">Completed Sessions</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            {sessions?.reduce((total, s) => total + s.creditsUsed, 0) || 0}
          </p>
          <p className="text-sm text-gray-600">Total Credits Used</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            {transactions?.filter(t => t.status === "approved").length || 0}
          </p>
          <p className="text-sm text-gray-600">Approved Purchases</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            ${transactions?.filter(t => t.status === "approved").reduce((total, t) => total + t.cost, 0).toFixed(2) || "0.00"}
          </p>
          <p className="text-sm text-gray-600">Total Spent</p>
        </div>
      </div>
    </div>
  );
}
