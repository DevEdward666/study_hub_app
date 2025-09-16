import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { QRGenerator } from "./QRGenerator";
import QRCode from "react-qr-code";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"transactions" | "tables" | "users" | "premise">("transactions");
  const [newTable, setNewTable] = useState({
    tableNumber: "",
    hourlyRate: 10,
    location: "",
    capacity: 4,
  });
  const [newPremise, setNewPremise] = useState({
    location: "",
    validityHours: 8,
  });
  const [selectedTableForQR, setSelectedTableForQR] = useState<string | null>(null);

  const pendingTransactions = useQuery(api.admin.getPendingTransactions);
  const allTables = useQuery(api.tables.getAllTables);
  const allUsers = useQuery(api.admin.getAllUsers);
  const premiseQRCodes = useQuery(api.premise.getPremiseQRCodes);
  
  const approveTransaction = useMutation(api.admin.approveTransaction);
  const rejectTransaction = useMutation(api.admin.rejectTransaction);
  const createTable = useMutation(api.admin.createStudyTable);
  const setupData = useMutation(api.admin.setupData);
  const toggleUserAdmin = useMutation(api.admin.toggleUserAdmin);
  const createPremiseQR = useMutation(api.premise.createPremiseQRCode);
  const generateTableQR = useMutation(api.admin.generateTableQR);

  const handleApprove = async (transactionId: any) => {
    try {
      await approveTransaction({ transactionId });
      toast.success("Transaction approved!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve");
    }
  };

  const handleReject = async (transactionId: any) => {
    try {
      await rejectTransaction({ transactionId });
      toast.success("Transaction rejected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject");
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createTable(newTable);
      toast.success(`Table created! QR Code: ${result.qrCode}`);
      setNewTable({
        tableNumber: "",
        hourlyRate: 10,
        location: "",
        capacity: 4,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create table");
    }
  };

  const handleCreatePremiseQR = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createPremiseQR(newPremise);
      toast.success(`Premise QR created! Code: ${result.code}`);
      setNewPremise({
        location: "",
        validityHours: 8,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create premise QR");
    }
  };

  const handleToggleAdmin = async (userId: any) => {
    try {
      const result = await toggleUserAdmin({ userId });
      toast.success(`User ${result.isAdmin ? "promoted to" : "removed from"} admin`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    }
  };

  const handleSetupData = async () => {
    try {
      const result = await setupData();
      if (result === "exists") {
        toast.info("Sample data already exists");
      } else {
        toast.success("Sample tables and premise codes created!");
      }
    } catch (error) {
      toast.error("Failed to setup data");
    }
  };

  const handleGenerateQR = async (tableId: any) => {
    try {
      const result = await generateTableQR({ tableId });
      setSelectedTableForQR(result.qrCode);
      toast.success(`QR code generated for Table ${result.tableNumber}`);
    } catch (error) {
      toast.error("Failed to generate QR code");
    }
  };

  const tabs = [
    { id: "transactions" as const, label: "Pending Transactions", count: pendingTransactions?.length || 0 },
    { id: "tables" as const, label: "Study Tables", count: allTables?.length || 0 },
    { id: "users" as const, label: "User Management", count: allUsers?.length || 0 },
    { id: "premise" as const, label: "Premise QR Codes", count: premiseQRCodes?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage transactions, tables, users, and premise access</p>
      </div>

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
            {tab.label}
            {tab.count > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Pending Credit Transactions</h2>
            
            {pendingTransactions?.length === 0 && (
              <p className="text-gray-500 text-center py-8">No pending transactions</p>
            )}

            <div className="space-y-4">
              {pendingTransactions?.map((transaction) => (
                <div
                  key={transaction._id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">
                        {transaction.user?.email || "Unknown User"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {transaction.amount} credits for ${transaction.cost.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Payment: {transaction.paymentMethod} • 
                        Transaction ID: {transaction.transactionId}
                      </p>
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(transaction._creationTime).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(transaction._id)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(transaction._id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tables" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Study Tables Management</h2>
              <button
                onClick={handleSetupData}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Setup Sample Data
              </button>
            </div>
            
            {/* Create New Table */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Create New Table</h3>
              <form onSubmit={handleCreateTable} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table Number
                  </label>
                  <input
                    type="text"
                    value={newTable.tableNumber}
                    onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate (credits)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newTable.hourlyRate}
                    onChange={(e) => setNewTable({ ...newTable, hourlyRate: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newTable.location}
                    onChange={(e) => setNewTable({ ...newTable, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newTable.capacity}
                    onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <button
                    type="submit"
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition-colors"
                  >
                    Create Table
                  </button>
                </div>
              </form>
            </div>

            {/* QR Code Display */}
            {selectedTableForQR && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Generated QR Code</h3>
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <div className="text-xs font-mono break-all mb-2"><QRCode value={selectedTableForQR}/> </div>
                    <div className="text-sm text-gray-600">
                      Print this QR code and place it on the table
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTableForQR(null)}
                    className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Existing Tables */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Existing Tables</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allTables?.map((table) => (
                  <div
                    key={table._id}
                    className={`border rounded-lg p-4 ${
                      table.isOccupied ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Table {table.tableNumber}</h4>
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          table.isOccupied ? "bg-red-500" : "bg-green-500"
                        }`}
                      ></span>
                    </div>
                    <p className="text-sm text-gray-600">{table.location}</p>
                    <p className="text-sm">
                      {table.hourlyRate} credits/hour • {table.capacity} people
                    </p>
                    <p className="text-xs text-gray-500 mt-2 font-mono">
                      QR: {table.qrCode}
                    </p>
                    <button
                      onClick={() => handleGenerateQR(table._id)}
                      className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Generate QR
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">User Management</h2>
            
            <div className="space-y-4">
              {allUsers?.map((user) => (
                <div
                  key={user._id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {user.name || user.email}
                        {user.isAdmin && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Admin
                          </span>
                        )}
                        {user.hasActiveSession && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Active Session
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        Credits: {user.credits} • 
                        Joined: {new Date(user._creationTime).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleAdmin(user._id)}
                        className={`px-4 py-2 rounded text-sm transition-colors ${
                          user.isAdmin
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {user.isAdmin ? "Remove Admin" : "Make Admin"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "premise" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Premise QR Code Management</h2>
            
            {/* Create New Premise QR */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Create New Premise QR Code</h3>
              <form onSubmit={handleCreatePremiseQR} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newPremise.location}
                    onChange={(e) => setNewPremise({ ...newPremise, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Main Entrance, Library Desk"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validity Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={newPremise.validityHours}
                    onChange={(e) => setNewPremise({ ...newPremise, validityHours: parseInt(e.target.value) || 8 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <button
                    type="submit"
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-hover transition-colors"
                  >
                    Create Premise QR Code
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Premise QR Codes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Existing Premise QR Codes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {premiseQRCodes?.map((premise) => (
                  <div
                    key={premise._id}
                    className={`border rounded-lg p-4 ${
                      premise.isActive ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                      <QRCode value={premise.code} size={128} />
                    <div className="flex items-center justify-between mb-2">
                    
                      <h4 className="font-semibold">{premise.location}</h4>
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${
                          premise.isActive ? "bg-green-500" : "bg-gray-500"
                        }`}
                      ></span>
                    </div>
                    <p className="text-sm">
                      Validity: {premise.validityHours} hours
                    </p>
                    <p className="text-xs text-gray-500 mt-2 font-mono break-all">
                      Code: {premise.code}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {premise.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
