import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonIcon,
  IonText,
  IonBadge,
  IonProgressBar,
  IonButton,
  IonList,
  IonModal,
  IonButtons,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonRefresher,
  IonRefresherContent,
} from "@ionic/react";
import {
  cardOutline,
  timeOutline,
  statsChartOutline,
  addOutline,
  closeOutline,
  refreshOutline,
} from "ionicons/icons";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useMySubscriptions, useSubscriptionPackages, usePurchaseSubscription } from "../hooks/SubscriptionHooks";
import { PurchaseSubscription } from "../schema/subscription.schema";
import "../styles/side-modal.css";

const MySubscriptions: React.FC = () => {
  const { data: subscriptions, isLoading, refetch } = useMySubscriptions();
  const { data: packages } = useSubscriptionPackages(true);
  const purchaseMutation = usePurchaseSubscription();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("success");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const [formData, setFormData] = useState<PurchaseSubscription>({
    packageId: "",
    paymentMethod: "Cash",
    cash: 0,
    change: 0,
  });

  const handlePurchase = () => {
    setFormData({
      packageId: "",
      paymentMethod: "Cash",
      cash: 0,
      change: 0,
    });
    setShowPurchaseModal(true);
  };

  const handleSavePurchase = async () => {
    if (!formData.packageId) {
      setToastMessage("❌ Please select a package");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    try {
      await purchaseMutation.mutateAsync(formData);
      setToastMessage("✅ Subscription purchased successfully!");
      setToastColor("success");
      setShowToast(true);
      setShowPurchaseModal(false);
    } catch (error: any) {
      setToastMessage(`❌ Failed to purchase: ${error.message}`);
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "expired":
        return "danger";
      case "cancelled":
        return "warning";
      default:
        return "medium";
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await refetch();
    event.detail.complete();
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your subscriptions..." />;
  }

  const activeSubscriptions = subscriptions?.filter((s) => s.status === "Active") || [];
  const totalRemainingHours = activeSubscriptions.reduce((sum, s) => sum + s.remainingHours, 0);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Subscriptions</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent pullingIcon={refreshOutline} />
        </IonRefresher>

        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
          {/* Stats Card */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            <IonCard>
              <IonCardContent style={{ textAlign: "center", padding: "16px" }}>
                <IonIcon icon={cardOutline} style={{ fontSize: "32px", color: "var(--ion-color-success)" }} />
                <h3 style={{ margin: "8px 0 4px", fontSize: "24px", fontWeight: "bold" }}>{activeSubscriptions.length}</h3>
                <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Active Subscriptions</p>
              </IonCardContent>
            </IonCard>
            <IonCard>
              <IonCardContent style={{ textAlign: "center", padding: "16px" }}>
                <IonIcon icon={timeOutline} style={{ fontSize: "32px", color: "var(--ion-color-primary)" }} />
                <h3 style={{ margin: "8px 0 4px", fontSize: "24px", fontWeight: "bold" }}>{totalRemainingHours.toFixed(0)}</h3>
                <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Hours Remaining</p>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Purchase Button */}
          <div style={{ marginBottom: "20px" }}>
            <IonButton expand="block" onClick={handlePurchase} color="success">
              <IonIcon icon={addOutline} slot="start" />
              Buy New Subscription
            </IonButton>
          </div>

          {/* Subscriptions List */}
          {!subscriptions || subscriptions.length === 0 ? (
            <IonCard>
              <IonCardContent style={{ textAlign: "center", padding: "40px" }}>
                <IonIcon icon={cardOutline} style={{ fontSize: "64px", color: "#ccc", marginBottom: "16px" }} />
                <IonText color="medium">
                  <h2>No Subscriptions Yet</h2>
                  <p>Purchase a subscription package to get started!</p>
                </IonText>
                <IonButton onClick={handlePurchase} style={{ marginTop: "16px" }}>
                  Browse Packages
                </IonButton>
              </IonCardContent>
            </IonCard>
          ) : (
            <IonList>
              {subscriptions.map((sub) => (
                <IonCard key={sub.id} style={{ marginBottom: "12px" }}>
                  <IonCardContent>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>{sub.packageName}</h3>
                        <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#666" }}>
                          ₱{sub.purchaseAmount.toFixed(2)} • {sub.paymentMethod}
                        </p>
                      </div>
                      <IonBadge color={getStatusColor(sub.status)}>{sub.status}</IonBadge>
                    </div>

                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                        <span>Hours Used:</span>
                        <span>
                          <strong>{sub.hoursUsed.toFixed(1)}</strong> / {sub.totalHours.toFixed(0)}
                        </span>
                      </div>
                      <IonProgressBar value={sub.percentageUsed / 100} color={sub.percentageUsed > 80 ? "danger" : "success"} />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#666", marginTop: "4px" }}>
                        <span>{sub.percentageUsed.toFixed(1)}% used</span>
                        <span style={{ color: "var(--ion-color-success)", fontWeight: "600" }}>
                          {sub.remainingHours.toFixed(1)} hours left
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: "12px", color: "#666" }}>
                      <div>Purchased: {new Date(sub.purchaseDate).toLocaleDateString()}</div>
                      {sub.activationDate && <div>Activated: {new Date(sub.activationDate).toLocaleDateString()}</div>}
                      {sub.expiryDate && <div>Expires: {new Date(sub.expiryDate).toLocaleDateString()}</div>}
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </IonList>
          )}

          {/* Purchase Modal */}
          <IonModal 
            isOpen={showPurchaseModal} 
            onDidDismiss={() => setShowPurchaseModal(false)}
            breakpoints={[0, 1]}
            initialBreakpoint={1}
            handle={false}
            className="side-modal"
          >
            <IonHeader>
              <IonToolbar>
                <IonTitle>Purchase Subscription</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => setShowPurchaseModal(false)}>
                    <IonIcon icon={closeOutline} />
                  </IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              <IonList>
                {packages?.map((pkg) => (
                  <IonCard
                    key={pkg.id}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        packageId: pkg.id,
                        cash: pkg.price,
                      });
                    }}
                    style={{
                      cursor: "pointer",
                      border: formData.packageId === pkg.id ? "2px solid var(--ion-color-primary)" : "none",
                    }}
                  >
                    <IonCardContent>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>{pkg.name}</h3>
                          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#666" }}>
                            {pkg.totalHours} total hours • {pkg.packageType}
                          </p>
                          {pkg.description && (
                            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#666" }}>{pkg.description}</p>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <h3 style={{ margin: 0, fontSize: "24px", color: "var(--ion-color-success)", fontWeight: "bold" }}>
                            ₱{pkg.price.toFixed(2)}
                          </h3>
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                ))}
              </IonList>

              {formData.packageId && (
                <>
                  <IonItem>
                    <IonLabel position="stacked">Payment Method *</IonLabel>
                    <IonSelect value={formData.paymentMethod} onIonChange={(e) => setFormData({ ...formData, paymentMethod: e.detail.value })}>
                      <IonSelectOption value="Cash">Cash</IonSelectOption>
                      <IonSelectOption value="GCash">GCash</IonSelectOption>
                      <IonSelectOption value="Card">Card</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                  <div style={{ marginTop: "24px" }}>
                    <IonButton expand="block" onClick={handleSavePurchase} disabled={purchaseMutation.isPending}>
                      {purchaseMutation.isPending ? "Processing..." : "Confirm Purchase"}
                    </IonButton>
                  </div>
                </>
              )}
            </IonContent>
          </IonModal>

          <IonToast isOpen={showToast} message={toastMessage} duration={3000} onDidDismiss={() => setShowToast(false)} color={toastColor} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MySubscriptions;

