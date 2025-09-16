import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { QRScanner } from "./QRScanner";
import { CreditManager } from "./CreditManager";
import { TableSession } from "./TableSession";
import { UserHistory } from "./UserHistory";

export function StudyHub() {
  const [activeTab, setActiveTab] = useState<"scan" | "credits" | "session" | "history">("scan");
  const userCredits = useQuery(api.credits.getUserCredits);
  const activeSession = useQuery(api.tables.getUserActiveSession);
  const premiseAccess = useQuery(api.premise.checkPremiseAccess);
  const initializeCredits = useMutation(api.credits.initializeUserCredits);

  // Initialize user credits if they don't exist
  useEffect(() => {
    if (userCredits === null) {
      initializeCredits();
    }
  }, [userCredits, initializeCredits]);

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const tabs = [
    { id: "scan" as const, label: "Scan QR", icon: "📱" },
    { id: "credits" as const, label: "Credits", icon: "💳" },
    { id: "session" as const, label: "Session", icon: "⏱️" },
    { id: "history" as const, label: "History", icon: "📋" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">Welcome to Study Hub</h1>
        <p className="text-gray-600">Scan premise QR first, then scan table QR codes to book study tables</p>
      </div>

      {/* Premise Access Status */}
      {premiseAccess ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <div>
                <h4 className="font-semibold text-green-800">Premise Access Active</h4>
                <p className="text-green-700 text-sm">
                  Location: {premiseAccess.location}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-green-800 font-semibold">
                {formatTimeRemaining(premiseAccess.timeRemaining)}
              </p>
              <p className="text-green-600 text-sm">remaining</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <h4 className="font-semibold text-yellow-800">Premise Access Required</h4>
              <p className="text-yellow-700 text-sm">
                Please scan a premise QR code at the entrance to activate table booking
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Credit Balance */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Credit Balance</h3>
            <p className="text-2xl font-bold text-primary">
              {userCredits?.balance ?? 0} credits
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Total Purchased: {userCredits?.totalPurchased ?? 0}</p>
            <p>Total Spent: {userCredits?.totalSpent ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Active Session Alert */}
      {activeSession && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600">🟢</span>
            <div>
              <h4 className="font-semibold text-green-800">Active Session</h4>
              <p className="text-green-700">
                Table {activeSession.table?.tableNumber} - Started{" "}
                {new Date(activeSession.startTime).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-primary shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {activeTab === "scan" && <QRScanner />}
        {activeTab === "credits" && <CreditManager />}
        {activeTab === "session" && <TableSession />}
        {activeTab === "history" && <UserHistory />}
      </div>
    </div>
  );
}
