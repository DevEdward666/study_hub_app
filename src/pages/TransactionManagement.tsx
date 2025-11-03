import React, { useState } from "react";
import {
  TransactionManagementServiceAPI,
  useTransactionsManagement,
  useTablesManagement,
  useUsersManagement,
} from "../hooks/AdminDataHooks";
import { useNotifications } from "../hooks/useNotifications";
import { useConfirmation } from "../hooks/useConfirmation";
import { useThermalPrinter } from "../hooks/useThermalPrinter";
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
  IonInput,
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
import { addOutline, printOutline } from "ionicons/icons";
import PromoSelector from "../components/common/PromoSelector";
const TransactionsManagement: React.FC = () => {
  const { isLoading, error, approve, reject, refetch } =
    useTransactionsManagement();
  const { notifyCreditApproved } = useNotifications();
  const { print: printDirect, isConnected: printerConnected } = useThermalPrinter();
  const [selectedTab, setSelectedTab] = useState<"active" | "all">("active");

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
  const [paymentMethod, setPaymentMethod] = useState<string>("Cash");
  const [cash, setCash] = useState<number>(0);
  const [change, setChange] = useState<number>(0);

  // Print Receipt Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [wifiPassword, setWifiPassword] = useState<string>("password1234");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

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
      paymentMethod: string;
      rateId?: string;
      cash?: number;
      change?: number;
    }) => {
      return tableService.startSession({
        tableId: data.tableId,
        userId: data.userId,
        hours: data.hours,
        qrCode: data.qrCode, // Use table's QR code for admin-initiated sessions
        promoId: data.promoId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        cash: data.cash,
        rateId: data.rateId,
        change: data.change,
      });
    },
    onSuccess: async (sessionId: string) => {
      // Try to print receipt automatically (non-blocking)
      try {
        await tableService.printReceipt(sessionId);
        console.log('Receipt printed successfully');
      } catch (error) {
        console.log(error)
        console.error('Failed to print receipt:', error);
        // Don't block the UI if printing fails
      }

      setShowNewTransactionModal(false);
      setSelectedTableId("");
      setSelectedUserId("");
      setSelectedRateId("");
      setSelectedPromoId(null);
      setPromoDiscount(0);
      setPaymentMethod("Cash");
      setCash(0);
      setChange(0);
      
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

  // Print receipt mutation - tries browser printing first, then backend fallback
  const printReceiptMutation = useMutation({
    mutationFn: async ({ sessionId, password }: { sessionId: string; password?: string }) => {
      // Try browser printing first if printer is connected
      if (printerConnected) {
        try {
          console.log('🖨️ Attempting browser printing...');
          
          // Get transaction details - find in either pending or all data
          const transaction = (pendingData?.data || allData?.data)?.find((t: any) => t.id === sessionId);

          if (transaction) {
            // Calculate hours from transaction data
            const startTime = transaction.startTime ? new Date(transaction.startTime) : new Date();
            const endTime = transaction.endTime ? new Date(transaction.endTime) : new Date();
            const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

            await printDirect({
              storeName: 'Sunny Side up Work + Study',
              sessionId: transaction.id || 'unknown',
              customerName: transaction.user?.name || transaction.user?.email || 'Customer',
              tableNumber: transaction.tables?.tableNumber || 'N/A',
              startTime: transaction.startTime || new Date().toISOString(),
              endTime: transaction.endTime || new Date().toISOString(),
              hours: hours,
              rate: transaction.tables?.hourlyRate || 0,
              totalAmount: transaction.cost || 0,
              paymentMethod: transaction.session?.paymentMethod || undefined,
              wifiPassword: password,
              package:transaction.rates?.description || "N/A",
            });
            
            console.log('✅ Browser printing successful!');
            return true;
          }
        } catch (error) {
          console.warn('⚠️ Browser printing failed, falling back to backend:', error);
        }
      }
      
      // Fallback to backend printing
      console.log('📡 Using backend printing...');
      return tableService.printReceipt(sessionId, password);
    },
    onSuccess: () => {
      setShowPasswordModal(false);
      setWifiPassword("password1234");
      showConfirmation({
        header: 'Receipt Printed',
        message: printerConnected 
          ? 'Receipt printed directly from browser!' 
          : 'Receipt sent to printer successfully!',
        confirmText: 'OK',
        cancelText: ''
      }, () => {});
    },
    onError: (error: any) => {
      console.error('Failed to print receipt:', error);
      showConfirmation({
        header: 'Print Failed',
        message: printerConnected
          ? 'Failed to print. Check printer connection or go to Settings to reconnect.'
          : 'Failed to print receipt. Please check the printer connection.',
        confirmText: 'OK',
        cancelText: ''
      }, () => {});
    },
  });

  // Handle print receipt - open password modal
  const handlePrintReceipt = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowPasswordModal(true);
  };

  // Confirm print with password
  const handleConfirmPrint = () => {
    if (selectedSessionId) {
      printReceiptMutation.mutate({ 
        sessionId: selectedSessionId, 
        password: wifiPassword 
      });
    }
  };

  // Promo handler
  const handlePromoSelect = (promoId: string | null, discount: number) => {
    setSelectedPromoId(promoId);
    setPromoDiscount(discount);
  };

  // Cash input handler - automatically calculate change
  const handleCashInput = (value: number) => {
    setCash(value);
    const totalAmount = sessionPrice - promoDiscount;
    const calculatedChange = value - totalAmount;
    setChange(calculatedChange >= 0 ? calculatedChange : 0);
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

    // Validate cash for Cash payment method
    const totalAmount = sessionPrice - promoDiscount;
    if (paymentMethod === "Cash" && cash < totalAmount) {
      showConfirmation({
        header: 'Insufficient Cash',
        message: `Cash amount (₱${cash.toFixed(2)}) is less than the total amount (₱${totalAmount.toFixed(2)}).\n\nPlease enter sufficient cash to proceed.`,
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
      paymentMethod: paymentMethod,
      rateId: selectedRateId,
      cash: paymentMethod === "Cash" ? cash : undefined,
      change: paymentMethod === "Cash" ? change : undefined,
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
    const currentData = selectedTab === "active" ? pendingData : allData;
    const transaction = currentData?.data.find((t: any) => t.id === transactionId);
    
    // Show confirmation dialog
    showConfirmation({
      header: 'Approve Transaction',
      message: `Are you sure you want to approve this credit purchase transaction?\n\n` +
        `Transaction ID: ${transactionId}\n` +
        `User: ${transaction?.user?.name || 'Unknown'}\n` +
        `Amount: ${transaction?.session?.amount || 0} credits\n\n` +
        `This will add credits to the user's account and cannot be undone.`,
      confirmText: 'Approve',
      cancelText: 'Cancel'
    }, async () => {
      try {
        await approve.mutateAsync(transactionId);
        
        // Send notification to user about credit approval
        if (transaction && transaction.user) {
          try {
            // Note: In a real implementation, the API would return the updated balance
            // For now, we'll use the amount as placeholder
            const newBalance = transaction?.session?.amount; // This should come from API response
            
            await notifyCreditApproved(
              transaction.user.id,
              transactionId,
              transaction?.session?.amount!,
              newBalance!
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
      render: (value) => value?.name || value?.email || "Unknown User",
    },
    {
      key: "tables",
      label: "Table No",
      sortable: true,
      render: (value) => value?.tableNumber || "N/A",
    },
    {
      key: "cost",
      label: "Cost",
      sortable: false,
      render: (value) => PesoFormat(value || 0),
    },
    {
      key: "startTime",
      label: "Start Time",
      sortable: true,
      render: (value) => value ? formatDate(value) : "N/A",
    },
    {
      key: "endTime",
      label: "End Time",
      sortable: true,
      render: (value) => value ? formatDate(value) : "N/A",
    },
    {
      key: "paymentMethod",
      label: "Payment Method",
      sortable: true,
      render: (value) => value || "N/A",
    },
    {
      key: "cash",
      label: "Cash",
      sortable: true,
      render: (value) => value ? PesoFormat(value) : "N/A",
    },
    {
      key: "change",
      label: "Change",
      sortable: true,
      render: (value) => value ? PesoFormat(value) : "N/A",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value) => createTableStatusChip(value || "Unknown"),
    },
    {
      key: "tables",
      label: "Date",
      sortable: true,
      render: (value) => formatDate(value?.createdAt || ""),
    },
    {
      key: "id",
      label: "Actions",
      sortable: false,
      render: (value, row) => (
        <IonButton
          size="small"
          fill="outline"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            console.log(row)
            handlePrintReceipt(value);
          }}
          disabled={printReceiptMutation.isPending}
        >
          <IonIcon icon={printOutline} slot="start" />
          Print Receipt
        </IonButton>
      ),
    },
  ];

  const allColumns: TableColumn<GetTransactionWithUserTableColumn>[] = [
   {
      key: "user",
      label: "User",
      sortable: true,
      render: (value) => value?.name || value?.email || "Unknown User",
    },
    {
      key: "tables",
      label: "Table No",
      sortable: true,
      render: (value) => value?.tableNumber || "N/A",
    },
    {
      key: "cost",
      label: "Cost",
      sortable: false,
      render: (value) => PesoFormat(value || 0),
    },
    {
      key: "startTime",
      label: "Start Time",
      sortable: true,
      render: (value) => value ? formatDate(value) : "N/A",
    },
    {
      key: "endTime",
      label: "End Time",
      sortable: true,
      render: (value) => value ? formatDate(value) : "N/A",
    },
    {
      key: "paymentMethod",
      label: "Payment Method",
      sortable: true,
      render: (value) => value || "N/A",
    },
    {
      key: "cash",
      label: "Cash",
      sortable: true,
      render: (value) => value ? PesoFormat(value) : "N/A",
    },
    {
      key: "change",
      label: "Change",
      sortable: true,
      render: (value) => value ? PesoFormat(value) : "N/A",
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value) => createTableStatusChip(value || "Unknown"),
    },
    {
      key: "tables",
      label: "Date",
      sortable: true,
      render: (value) => formatDate(value?.createdAt || ""),
    },
    {
      key: "id",
      label: "Actions",
      sortable: false,
      render: (value, row) => (
        <IonButton
          size="small"
          fill="outline"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            handlePrintReceipt(value);
          }}
          disabled={printReceiptMutation.isPending}
        >
          <IonIcon icon={printOutline} slot="start" />
          Print Receipt
        </IonButton>
      ),
    },
  ];
  
  const currentData = selectedTab === "active" ? pendingData : allData;
  const currentColumns = selectedTab === "active" ? pendingColumns : allColumns;
  const currentTableState = selectedTab === "active" ? pendingTableState : allTableState;
  const currentUpdateState = selectedTab === "active" ? updatePendingState : updateAllState;
  const currentIsLoading = selectedTab === "active" ? isLoadingPending : isLoadingAll;
  const currentIsFetching = selectedTab === "active" ? isFetchingPending : isFetchingAll;
  const currentIsError = selectedTab === "active" ? isErrorPending : isErrorAll;
  const currentError = selectedTab === "active" ? errorPending : errorAll;
  const currentRefetch = selectedTab === "active" ? refetchPendingTable : refetchAllTable;

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
          onIonChange={(e) => setSelectedTab(e.detail.value as "active" | "all")}
        >
          <IonSegmentButton value="active">
            <IonLabel>Inprogress</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="all">
            <IonLabel>Completed Transactions</IonLabel>
          </IonSegmentButton>
        </IonSegment>
      </div>

      {currentData?.data.length === 0 ? (
        <div className="empty-state">
          <h3>{selectedTab === "active" ? "No active transactions" : "No transactions found"}</h3>
          <p>{selectedTab === "active" ? "All transactions have been processed" : "No transaction history available"}</p>
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
          setSelectedRateId("");
          setSelectedPromoId(null);
          setPromoDiscount(0);
          setPaymentMethod("Cash");
          setCash(0);
          setChange(0);
        }}
        title="Add New Transaction"
        position="end"
        size="medium"
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
          
          {/* Rate Selection */}
          <IonItem style={{ marginBottom: "20px" }}>
            <IonLabel>Rate Package *</IonLabel>
            <IonSelect
              placeholder="Select a rate"
              value={selectedRateId}
              onIonChange={(e) => setSelectedRateId(e.detail.value)}
            >
              {rates?.map((rate) => (
                <IonSelectOption key={rate.id} value={rate.id}>
                  {rate.hours} {rate.hours === 1 ? "Hour" : "Hours"} - ₱{rate.price.toFixed(2)}
                  {rate.description && ` (${rate.description})`}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {/* Payment Method Selection */}
          <IonItem style={{ marginBottom: "20px" }}>
            <IonLabel>Payment Method *</IonLabel>
            <IonSelect
              placeholder="Select payment method"
              value={paymentMethod}
              onIonChange={(e) => setPaymentMethod(e.detail.value)}
            >
              <IonSelectOption value="Cash">Cash</IonSelectOption>
              <IonSelectOption value="EWallet">EWallet</IonSelectOption>
              <IonSelectOption value="Bank Transfer">Bank Transfer</IonSelectOption>
            </IonSelect>
          </IonItem>

          {/* Cash Input - Only show for Cash payment method */}
          {paymentMethod === "Cash" && (
            <IonItem style={{ marginBottom: "20px" }}>
              <IonLabel position="stacked">Cash Amount *</IonLabel>
              <IonInput
                type="number"
                value={cash}
                placeholder="Enter cash amount"
                onIonInput={(e) => handleCashInput(parseFloat(e.detail.value || "0"))}
                min={0}
                step="0.01"
              />
            </IonItem>
          )}

          {/* Promo Selection */}
          {/* <div style={{ marginBottom: "20px" }}>
            <PromoSelector
              sessionCost={sessionPrice}
              selectedPromoId={selectedPromoId}
              onPromoSelect={handlePromoSelect}
              disabled={false}
            />
          </div> */}

          <div style={{ padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
            {selectedRate ? (
              <>
                <p className="rate-container"><strong>Selected Rate:</strong> {selectedRate.hours} {selectedRate.hours === 1 ? "Hour" : "Hours"}</p>
                <p className="rate-container"><strong>Price:</strong> ₱{selectedRate.price.toFixed(2)}</p>
                {selectedRate.description && (
                  <p className="rate-container" style={{ fontSize: "12px", color: "#666" }}>{selectedRate.description}</p>
                )}
                {promoDiscount > 0 && (
                  <p className="rate-container" style={{ color: "#28a745" }}><strong>Promo Discount:</strong> -₱{promoDiscount}</p>
                )}
                <p className="rate-container"><strong>Total Amount:</strong> ₱{(selectedRate.price - promoDiscount).toFixed(2)}</p>
                {paymentMethod === "Cash" && cash > 0 && (
                  <>
                    <p className="rate-container" style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #ddd" }}>
                      <strong>Cash Received:</strong> ₱{cash.toFixed(2)}
                    </p>
                    {cash < (selectedRate.price - promoDiscount) ? (
                      <p className="rate-container" style={{ color: "#dc3545" }}>
                        <strong>⚠️ Insufficient:</strong> Need ₱{((selectedRate.price - promoDiscount) - cash).toFixed(2)} more
                      </p>
                    ) : (
                      <p className="rate-container" style={{ color: "#28a745" }}>
                        <strong>Change:</strong> ₱{change.toFixed(2)}
                      </p>
                    )}
                  </>
                )}
                <p className="rate-container"><strong>End Time:</strong> {new Date(Date.now() + selectedRate.hours * 60 * 60 * 1000).toLocaleString()}</p>
              </>
            ) : (
              <p style={{ color: "#999", textAlign: "center" }}>Please select a rate package</p>
            )}
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
                  setSelectedRateId("");
                  setSelectedPromoId(null);
                  setPromoDiscount(0);
                  setPaymentMethod("Cash");
                  setCash(0);
                  setChange(0);
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

      {/* WiFi Password Modal for Print Receipt */}
      <SlideoutModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setWifiPassword("password1234");
          setSelectedSessionId("");
        }}
        title="Print Receipt - WiFi Password"
        position="end"
        size="small"
      >
        <div style={{ padding: "20px" }}>
          <p style={{ marginBottom: "20px", color: "#666" }}>
            Enter the WiFi password to be printed on the receipt as a QR code.
          </p>

          <IonItem style={{ marginBottom: "20px" }}>
            <IonLabel position="stacked">WiFi Password *</IonLabel>
            <IonInput
              type="text"
              value={wifiPassword}
              placeholder="Enter WiFi password"
              onIonInput={(e) => setWifiPassword(e.detail.value || "")}
            />
          </IonItem>

          <div style={{ 
            padding: "15px", 
            background: "#f0f9ff", 
            borderRadius: "8px",
            border: "1px solid #0ea5e9"
          }}>
            <p style={{ margin: 0, fontSize: "14px", color: "#0369a1" }}>
              <strong>📱 QR Code Preview:</strong>
            </p>
            <p style={{ margin: "8px 0 0 0", fontSize: "13px", color: "#0c4a6e" }}>
              Password: <strong>{wifiPassword || "(empty)"}</strong>
            </p>
            <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#64748b" }}>
              This will be printed as a scannable QR code on the receipt.
            </p>
          </div>
        </div>

        <IonFooter className="ion-no-border">
          <IonToolbar>
            <IonButtons slot="end" className="modal-action-buttons">
              <IonButton
                onClick={() => {
                  setShowPasswordModal(false);
                  setWifiPassword("password1234");
                  setSelectedSessionId("");
                }}
              >
                Cancel
              </IonButton>
              <IonButton
                onClick={handleConfirmPrint}
                disabled={!wifiPassword || printReceiptMutation.isPending}
                color="primary"
                fill="solid"
              >
                {printReceiptMutation.isPending ? "Printing..." : "Print Receipt"}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonFooter>
      </SlideoutModal>
    </div>
  );
};
export default TransactionsManagement;
