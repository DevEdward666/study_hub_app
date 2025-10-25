// src/pages/credits/Credits.tsx
import React, { useState } from "react";
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonModal,
  IonBadge,
  RefresherEventDetail,
} from "@ionic/react";
import {
  cardOutline,
  addOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  hourglass,
} from "ionicons/icons";
import { useUser } from "../../hooks/UserHooks";
import { useAuth } from "../../hooks/AuthHooks";
import { useConfirmation } from "../../hooks/useConfirmation";
import { ConfirmToast } from "../../components/common/ConfirmToast";
import { useNotifications } from "../../hooks/useNotifications";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { PurchaseCreditsRequestSchema } from "../../schema/user.schema";
import "./credits.css";
import { PesoFormat } from "@/shared/PesoHelper";

const Credits: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState<number>(100);
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { user } = useAuth();
  const { notifyCreditPurchase } = useNotifications();

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
    credits,
    transactions,
    isLoadingCredits,
    isLoadingTransactions,
    purchaseCredits,
    refetchCredits,
    refetchTransactions,
  } = useUser();

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await Promise.all([refetchCredits(), refetchTransactions()]);
    event.detail.complete();
  };

    const handlePurchase = async () => {
    // Show confirmation dialog
    showConfirmation({
      header: 'Purchase Credits',
      message: `Are you sure you want to purchase ${amount} credits?\n\n` +
        `Amount: ${amount} credits\n` +
        `Cost: ${PesoFormat(amount * 0.1)}\n` +
        `Payment Method: ${paymentMethod.replace("_", " ").toUpperCase()}\n\n` +
        `This request will be sent to admin for approval.`,
      confirmText: 'Purchase',
      cancelText: 'Cancel'
    }, async () => {
      try {
        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        await purchaseCredits.mutateAsync({
          amount,
          paymentMethod,
          transactionId,
        });

        // Send notification to admins about credit purchase
        if (user) {
          try {
            await notifyCreditPurchase(
              user.id,
              user.name || user.email,
              amount,
              transactionId
            );
          } catch (notifError) {
            console.error("Failed to send credit purchase notification:", notifError);
          }
        }

        setToastMessage(
          `✅ Purchase request submitted successfully! Transaction ID: ${transactionId}`
        );
        setShowToast(true);
        setIsModalOpen(false);

        // Reset form
        setAmount(100);
        setPaymentMethod("credit_card");
      } catch (error: any) {
        setToastMessage(
          `❌ Failed to submit purchase request: ${error.message || "Unknown error"}`
        );
        setShowToast(true);
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      default:
        return "warning";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return checkmarkCircleOutline;
      case "rejected":
        return closeCircleOutline;
      default:
        return hourglass;
    }
  };

  if (isLoadingCredits) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Credits</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <LoadingSpinner message="Loading credits..." />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Credits</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="credits-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="credits-container">
          {/* Balance Card */}
          <IonCard className="balance-card">
            <IonCardHeader>
              <IonCardTitle className="balance-title">
                <IonIcon icon={cardOutline} />
                Current Balance
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="balance-content">
                <div className="balance-amount">
                  <h1>{credits?.balance || 0}</h1>
                  <span>Credits</span>
                </div>
                <IonButton
                  fill="solid"
                  onClick={() => setIsModalOpen(true)}
                  className="purchase-button"
                >
                  <IonIcon icon={addOutline} slot="start" />
                  Purchase Credits
                </IonButton>
              </div>

              {credits && (
                <div className="balance-stats">
                  <div className="stat">
                    <span className="stat-label">Total Purchased</span>
                    <span className="stat-value">{credits.totalPurchased}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Spent</span>
                    <span className="stat-value">{credits.totalSpent}</span>
                  </div>
                </div>
              )}
            </IonCardContent>
          </IonCard>

          {/* Transactions */}
          <div className="transactions-section">
            <h2>Recent Transactions</h2>

            {isLoadingTransactions ? (
              <LoadingSpinner size="medium" message="Loading transactions..." />
            ) : transactions.length === 0 ? (
              <IonCard className="empty-card">
                <IonCardContent>
                  <div className="empty-content">
                    <IonIcon icon={timeOutline} className="empty-icon" />
                    <h3>No transactions yet</h3>
                    <p>Your purchase history will appear here</p>
                  </div>
                </IonCardContent>
              </IonCard>
            ) : (
              <div className="transactions-list">
                {transactions.slice(0, 10).map((transaction) => (
                  <IonCard key={transaction.id} className="transaction-card">
                    <IonCardContent>
                      <div className="transaction-content">
                        <div className="transaction-info">
                          <div className="transaction-header">
                            <h3>{transaction.amount} Credits</h3>
                            <IonBadge
                              color={getStatusColor(transaction.status)}
                            >
                              <IonIcon
                                icon={getStatusIcon(transaction.status)}
                              />
                              {transaction.status}
                            </IonBadge>
                          </div>
                          <div className="transaction-details">
                            <p>Cost: ${transaction.cost.toFixed(2)}</p>
                            <p>
                              Method:{" "}
                              {transaction.paymentMethod
                                .replace("_", " ")
                                .toUpperCase()}
                            </p>
                            <p>
                              Date:{" "}
                              {new Date(
                                transaction.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Purchase Modal */}
        <IonModal
          isOpen={isModalOpen}
          onDidDismiss={() => setIsModalOpen(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Purchase Credits</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </IonButton>
            </IonToolbar>
          </IonHeader>

          <IonContent className="purchase-modal-content">
            <div className="purchase-form">
              <IonCard>
                <IonCardContent>
                  <div className="form-section">
                    <h3>Credit Packages</h3>
                    <div className="package-options">
                      <div
                        className={`package-option ${amount === 100 ? "selected" : ""}`}
                        onClick={() => setAmount(100)}
                      >
                        <h4>100 Credits</h4>
                        <p>{PesoFormat(100.0)}</p>
                      </div>
                      <div
                        className={`package-option ${amount === 250 ? "selected" : ""}`}
                        onClick={() => setAmount(250)}
                      >
                        <h4>250 Credits</h4>
                        <p>{PesoFormat(250.0)}</p>
                      </div>
                      <div
                        className={`package-option ${amount === 500 ? "selected" : ""}`}
                        onClick={() => setAmount(500)}
                      >
                        <h4>500 Credits</h4>
                        <p>{PesoFormat(500.0)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <IonItem>
                      <IonLabel position="stacked">Custom Amount</IonLabel>
                      <IonInput
                        type="number"
                        value={amount}
                        placeholder="Enter amount"
                        onIonInput={(e) =>
                          setAmount(parseInt(e.detail.value!, 10) || 0)
                        }
                        min="1"
                        max="10000"
                      />
                    </IonItem>
                  </div>

                  <div className="form-section">
                    <IonItem>
                      <IonLabel position="stacked">Payment Method</IonLabel>
                      <IonSelect
                        value={paymentMethod}
                        placeholder="Select payment method"
                        onIonChange={(e) => setPaymentMethod(e.detail.value)}
                      >
                        <IonSelectOption value="cash">Cash</IonSelectOption>
                        {/* <IonSelectOption value="debit_card">
                          Debit Card
                        </IonSelectOption>
                        <IonSelectOption value="bank_transfer">
                          Bank Transfer
                        </IonSelectOption> */}
                        {/* <IonSelectOption value="paypal">PayPal</IonSelectOption> */}
                      </IonSelect>
                    </IonItem>
                  </div>

                  <div className="purchase-summary">
                    <div className="summary-row">
                      <span>Credits:</span>
                      <span>{amount}</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>{PesoFormat(amount * 0.1)}</span>
                    </div>
                  </div>

                  <IonButton
                    expand="block"
                    onClick={handlePurchase}
                    disabled={purchaseCredits.isPending || amount < 1}
                    className="confirm-purchase-button"
                  >
                    {purchaseCredits.isPending
                      ? "Processing..."
                      : "Confirm Purchase"}
                  </IonButton>

                  <div className="purchase-note">
                    <p>
                      <small>
                        Note: Purchases require admin approval and may take some
                        time to process.
                      </small>
                    </p>
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />

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
      </IonContent>
    </IonPage>
  );
};

export default Credits;
