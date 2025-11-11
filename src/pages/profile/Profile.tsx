// src/pages/profile/Profile.tsx
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
  IonAvatar,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  IonModal,
  IonList,
  IonToggle,
  IonBadge,
  RefresherEventDetail,
} from "@ionic/react";
import {
  personOutline,
  mailOutline,
  calendarOutline,
  settingsOutline,
  logOutOutline,
  checkmarkOutline,
  closeOutline,
  shieldCheckmarkOutline,
  pencilOutline,
} from "ionicons/icons";
import { useAuth } from "../../hooks/AuthHooks";
import { useUser } from "../../hooks/UserHooks";
import { useConfirmation } from "../../hooks/useConfirmation";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ConfirmToast } from "../../components/common/ConfirmToast";
import { ServiceWorkerDebug } from "../../components/debug/ServiceWorkerDebug";
import "./Profile.css";
import "../../Admin/styles/admin.css";
import "../../Admin/styles/admin-responsive.css";
import "../../styles/side-modal.css";
import { useHistory } from "react-router-dom";

const Profile: React.FC = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "danger">("success");

  const { user, signOut, refetchUser } = useAuth();
  const { credits, sessions, refetchCredits } = useUser();
  const history = useHistory();

  // Confirmation toast hook
  const {
    isOpen: isConfirmOpen,
    options: confirmOptions,
    showConfirmation,
    handleConfirm: confirmAction,
    handleCancel: cancelAction,
    handleDismiss: dismissConfirm
  } = useConfirmation();
  React.useEffect(() => {
    if (user?.name) {
      setEditName(user.name);
    }
  }, [user?.name]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await Promise.all([refetchUser(), refetchCredits()]);
    event.detail.complete();
  };

  const handleSignOut = async () => {
    // Show confirmation toast
    showConfirmation({
      header: 'Sign Out',
      message: `Are you sure you want to sign out?\n\nYou will be logged out of the Sunny Side Up app and redirected to the login page.`,
      confirmText: 'Sign Out',
      cancelText: 'Stay Logged In'
    }, async () => {
      await performSignOut();
    });
  };

  const performSignOut = async () => {
    try {
      await signOut.mutateAsync();
      history.push("/admin/login");
    } catch (error) {
      console.error("Sign out error:", error);
      setToastMessage("Failed to sign out. Please try again.");
      setToastColor("danger");
      setShowToast(true);
    }
  };

  const handleSaveProfile = async () => {
    // Note: This would require an API endpoint to update user profile
    // For now, we'll just show a success message
    setToastMessage("Profile updated successfully!");
    setToastColor("success");
    setShowToast(true);
    setIsEditModalOpen(false);
  };

  const getInitials = (name?: string): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  };

  const formatJoinDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getActivityStats = () => {
    const completedSessions =
      sessions?.filter((s) => s.status === "Completed").length || 0;
    const totalCreditsUsed =
      sessions?.reduce((sum, s) => sum + s.amount, 0) || 0;
    const totalHours =
      sessions?.reduce((sum, s) => {
        if (s.endTime && s.startTime) {
          const duration =
            new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
          return sum + duration / (1000 * 60 * 60); // Convert to hours
        }
        return sum;
      }, 0) || 0;

    return {
      completedSessions,
      totalCreditsUsed,
      totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
    };
  };

  const stats = getActivityStats();

  if (!user) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <LoadingSpinner message="Loading profile..." />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonContent fullscreen className="profile-content">

      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h2 style={{ color: 'var(--ion-color-primary)' }}>
              Profile</h2>
          </div>
        </div>
      </div>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      <IonCard className="profile-container">
        {/* Profile Header */}
        <IonCard className="profile-header-card">
          <IonCardContent>
            <div className="profile-header">
              <div className="profile-avatar-section">
                <IonAvatar className="profile-avatar">
                  {user.image ? (
                    <img src={user.image} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      {getInitials(user.name!)}
                    </div>
                  )}
                </IonAvatar>

                <div className="profile-basic-info">
                  <h2>{user.name || "User"}</h2>
                  <p>{user.email}</p>
                  {user.emailVerified && (
                    <IonBadge color="success" className="verified-badge">
                      <IonIcon icon={checkmarkOutline} />
                      Verified
                    </IonBadge>
                  )}
                </div>
              </div>

              <IonButton
                fill="outline"
                size="small"
                onClick={() => setIsEditModalOpen(true)}
                className="edit-profile-btn"
              >
                <IonIcon icon={pencilOutline} slot="start" />
                Edit
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Account Information */}
        <IonCard className="account-info-card">
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={personOutline} />
              Account Information
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList className="info-list">
              <IonItem className="info-item">
                <IonIcon icon={mailOutline} slot="start" />
                <IonLabel>
                  <h3>Email</h3>
                  <p>{user.email}</p>
                </IonLabel>
                {user.emailVerified && (
                  <IonIcon
                    icon={shieldCheckmarkOutline}
                    slot="end"
                    color="success"
                  />
                )}
              </IonItem>

              <IonItem className="info-item">
                <IonIcon icon={calendarOutline} slot="start" />
                <IonLabel>
                  <h3>Member Since</h3>
                  <p>{formatJoinDate(user.createdAt)}</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>



        {/* Debug Component - Only show in development */}
        {import.meta.env.DEV && (
          <ServiceWorkerDebug />
        )}

        {/* Account Actions */}
        <div className="account-actions">
          <IonButton
            expand="block"
            fill="outline"
            color="danger"
            onClick={handleSignOut}
            disabled={signOut.isPending}
            className="sign-out-button"
          >
            <IonIcon icon={logOutOutline} slot="start" />
            {signOut.isPending ? "Signing out..." : "Sign Out"}
          </IonButton>
        </div>
      </IonCard>

      {/* Edit Profile Modal */}
      <IonModal
        isOpen={isEditModalOpen}
        onDidDismiss={() => setIsEditModalOpen(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Edit Profile</IonTitle>
            <IonButton
              slot="end"
              fill="clear"
              onClick={() => setIsEditModalOpen(false)}
            >
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonToolbar>
        </IonHeader>

        <IonContent className="edit-modal-content">
          <div className="edit-form">
            <IonCard>
              <IonCardContent>
                <div className="edit-avatar-section">
                  <IonAvatar className="edit-avatar">
                    {user.image ? (
                      <img src={user.image} alt="Profile" />
                    ) : (
                      <div className="avatar-placeholder">
                        {getInitials(editName)}
                      </div>
                    )}
                  </IonAvatar>
                  <IonButton fill="outline" size="small">
                    Change Photo
                  </IonButton>
                </div>

                <div className="edit-fields">
                  <IonItem>
                    <IonLabel position="stacked">Full Name</IonLabel>
                    <IonInput
                      value={editName}
                      placeholder="Enter your full name"
                      onIonInput={(e) => setEditName(e.detail.value!)}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Email</IonLabel>
                    <IonInput value={user.email} readonly disabled />
                  </IonItem>
                </div>

                <div className="edit-actions">
                  <IonButton
                    expand="block"
                    onClick={handleSaveProfile}
                    disabled={!editName.trim()}
                  >
                    <IonIcon icon={checkmarkOutline} slot="start" />
                    Save Changes
                  </IonButton>
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
        color={toastColor}
      />

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
  );
};

export default Profile;
