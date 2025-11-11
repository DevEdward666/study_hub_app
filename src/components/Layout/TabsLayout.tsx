import React, { useState, useEffect } from "react";
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  useIonViewDidEnter,
  IonButton,
  IonBadge,
} from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import {
  homeOutline,
  qrCodeOutline,
  cardOutline,
  businessOutline,
  timeOutline,
  personOutline,
  tabletPortrait,
  listCircleOutline,
  peopleCircle,
  listOutline,
  listSharp,
  tabletPortraitSharp,
  statsChartOutline,
  menuOutline,
  closeOutline,
  walletOutline,
  chevronForwardOutline,
  chevronBackOutline,
  wifiOutline,
  settingsOutline,
  cashOutline,
  notificationsOutline,
} from "ionicons/icons";
import "./TabsLayout.css";
import { useAdminStatus } from "@/hooks/AdminHooks";
import { useNotifications } from "@/hooks/useNotifications";
import { GlobalToast, useToastManager } from "@/components/GlobalToast/GlobalToast";
import { signalRService, SessionEndedNotification } from "@/services/signalr.service";
import { useNotificationContext } from "@/contexts/NotificationContext";

interface TabsLayoutProps {
  children: React.ReactNode;
}

export const TabsLayout: React.FC<TabsLayoutProps> = ({ children }) => {
  const { refetch: refetchAdminStatus, isAdmin, isLoading: isAdminLoading } = useAdminStatus();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const isAdminPath = window.location.pathname.includes("/admin");
  const {
    notifySessionEnd,
    isSupported: isPushSupported,
    permission: pushPermission,
    requestPermission: requestPushPermission
  } = useNotifications();

  // Toast manager
  const { toasts, showToast, dismissToast } = useToastManager();

  // Notification context
  const { addNotification, unreadCount } = useNotificationContext();

  // Track if SignalR is initialized to prevent multiple starts
  const signalRInitialized = React.useRef(false);

  // Setup SignalR for admin users
  useEffect(() => {
    // Only initialize SignalR if user is admin AND on admin path
    if (!isAdmin || !isAdminPath) {
      // If we leave admin area, stop SignalR
      if (signalRInitialized.current) {
        console.log('Leaving admin area, stopping SignalR...');
        signalRService.stop();
        signalRInitialized.current = false;
      }
      return;
    }

    // Prevent multiple initializations
    if (signalRInitialized.current) {
      console.log('SignalR already initialized, skipping...');
      return;
    }

    const setupSignalR = async () => {
      try {
        console.log('Setting up SignalR for admin...');

        // Set up session ended handler (idempotent - can be called multiple times)
        signalRService.onSessionEnded((notification: SessionEndedNotification) => {
          console.log('Session ended notification:', notification);

          // Add to notification context (which will trigger table refresh)
          addNotification(notification);

          // Format the message
          const message = `🔔 Table ${notification.tableNumber} session ended for ${notification.userName}. Duration: ${notification.duration.toFixed(2)}hrs, Amount: ₱${notification.amount.toFixed(2)}`;

          // Show toast with sound and speech (pass table number for speech)
          showToast(message, 'warning', 10000, true, notification.tableNumber);
        });

        // Start the connection
        await signalRService.start();
        signalRInitialized.current = true;
        console.log('SignalR setup complete');
      } catch (error) {
        console.error('Failed to setup SignalR:', error);
        signalRInitialized.current = false;
      }
    };

    setupSignalR();

    // Cleanup function - only called when component unmounts or deps change
    return () => {
      // Only stop if we're leaving the admin area entirely
      // Don't stop on every re-render
      console.log('SignalR useEffect cleanup triggered');
    };
  }, [isAdmin, isAdminPath, addNotification, showToast]); // Added dependencies

  useIonViewDidEnter(() => {
    if (pushPermission !== "granted") {
      requestPushPermission();
    }
  })

  // Refetch admin status when navigating to admin paths
  useEffect(() => {
    if (isAdminPath) {
      refetchAdminStatus();
    }
  }, [isAdminPath, refetchAdminStatus]);

  const navigateTo = (path: string) => {
    history.push(path);
    setSidebarOpen(false); // Close sidebar after navigation on mobile
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  // If we're on an admin path but still loading admin status, show loading
  if (isAdminPath && isAdminLoading) {
    return (
      <div className="admin-loading">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div className="spinner"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-layout ${isAdmin && isAdminPath ? 'admin-layout' : 'user-layout'} ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {isAdmin && isAdminPath && (
        <>
          {/* Mobile Menu Button */}
          <IonButton
            fill="clear"
            className={`mobile-menu-btn ${sidebarOpen ? 'sidebar-open' : ''}`}
            onClick={toggleSidebar}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <IonIcon
              icon={sidebarOpen ? chevronBackOutline : chevronForwardOutline}
              style={{
                transition: 'transform 0.2s ease'
              }}
            />
          </IonButton>

          {/* Sidebar Overlay for mobile */}
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

          <nav className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <div className="sidebar-header">
              <h3>Sunny Side Up Admin</h3>
              <IonButton
                fill="clear"
                className="sidebar-close-btn"
                onClick={() => setSidebarOpen(false)}
                title="Close menu"
              >
                <IonIcon
                  icon={closeOutline}
                  style={{ fontSize: '20px' }}
                />
              </IonButton>
            </div>
            <div className="sidebar-menu">
              <button
                onClick={() => navigateTo('/app/admin/dashboard')}
                className={`sidebar-item ${isActiveRoute('/app/admin/dashboard') ? 'active' : ''}`}
              >
                <IonIcon icon={statsChartOutline} />
                <span>Dashboard</span>
              </button>

              {/* PRIMARY WORKFLOW */}
              <p style={{ fontSize: '11px', margin: '0 0 4px 0', fontWeight: 'bold' }}>MAIN WORKSPACE</p>
              <button
                onClick={() => navigateTo('/app/admin/user-sessions')}
                className={`sidebar-item ${isActiveRoute('/app/admin/user-sessions') ? 'active' : ''}`}
                style={{ color: 'white' }}
              >
                <IonIcon icon={peopleCircle} />
                <span> User & Sessions</span>
              </button>

              {/* SUBSCRIPTION MANAGEMENT */}
              <div style={{ margin: '16px 0 8px 0' }}>
                <p style={{ fontSize: '11px', color: '#666', margin: '0 0 4px 8px', fontWeight: 'bold' }}>SUBSCRIPTION SETUP</p>
              </div>

              <button
                onClick={() => navigateTo('/app/admin/subscription-packages')}
                className={`sidebar-item ${isActiveRoute('/app/admin/subscription-packages') ? 'active' : ''}`}
              >
                <IonIcon icon={cardOutline} />
                <span>Rate Packages</span>
              </button>

              <button
                onClick={() => navigateTo('/app/admin/user-subscriptions')}
                className={`sidebar-item ${isActiveRoute('/app/admin/user-subscriptions') ? 'active' : ''}`}
              >
                <IonIcon icon={walletOutline} />
                <span>Transaction</span>
              </button>

              {/* SYSTEM MANAGEMENT */}
              <div style={{ margin: '16px 0 8px 0' }}>
                <p style={{ fontSize: '11px', color: '#666', margin: '0 0 4px 8px', fontWeight: 'bold' }}>SYSTEM</p>
              </div>

              <button
                onClick={() => navigateTo('/app/admin/tables')}
                className={`sidebar-item ${isActiveRoute('/app/admin/tables') ? 'active' : ''}`}
              >
                <IonIcon icon={tabletPortraitSharp} />
                <span>Table Setup</span>
              </button>

              <button
                onClick={() => navigateTo('/app/admin/transactions')}
                className={`sidebar-item ${isActiveRoute('/app/admin/transactions') ? 'active' : ''}`}
              >
                <IonIcon icon={listOutline} />
                <span>Transaction History</span>
              </button>

              <button
                onClick={() => navigateTo('/app/admin/users')}
                className={`sidebar-item ${isActiveRoute('/app/admin/users') ? 'active' : ''}`}
              >
                <IonIcon icon={peopleCircle} />
                <span>User Accounts</span>
              </button>

              <button
                onClick={() => navigateTo('/app/admin/reports')}
                className={`sidebar-item ${isActiveRoute('/app/admin/reports') ? 'active' : ''}`}
              >
                <IonIcon icon={listCircleOutline} />
                <span>Reports</span>
              </button>

              <button
                onClick={() => navigateTo('/app/admin/notifications')}
                className={`sidebar-item ${isActiveRoute('/app/admin/notifications') ? 'active' : ''}`}
              >
                <IonIcon icon={notificationsOutline} />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <IonBadge color="danger" className="sidebar-badge">
                    {unreadCount}
                  </IonBadge>
                )}
              </button>

              <button
                onClick={() => navigateTo('/app/admin/global-settings')}
                className={`sidebar-item ${isActiveRoute('/app/admin/global-settings') ? 'active' : ''}`}
              >
                <IonIcon icon={settingsOutline} />
                <span>Settings</span>
              </button>

              <button
                onClick={() => navigateTo('/app/admin/profile')}
                className={`sidebar-item ${isActiveRoute('/app/admin/profile') ? 'active' : ''}`}
              >
                <IonIcon icon={personOutline} />
                <span>Profile</span>
              </button>
            </div>
          </nav>
        </>
      )}

      <main className="main-content">
        {(isAdmin && isAdminPath) ? (
          // For admin, use simple router outlet without tabs
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        ) : !isAdminPath ? (
          // For users, use the tab system (only if not on admin path)
          <IonTabs>
            <IonRouterOutlet>{children}</IonRouterOutlet>
            <IonTabBar slot="bottom" className="tabs-bar mobile-only">
              <IonTabButton tab="dashboard" href="/app/dashboard">
                <IonIcon icon={homeOutline} />
                <IonLabel>Dashboard</IonLabel>
              </IonTabButton>

              <IonTabButton tab="scanner" href="/app/scanner">
                <IonIcon icon={qrCodeOutline} />
                <IonLabel>Scanner</IonLabel>
              </IonTabButton>


              <IonTabButton tab="credits" href="/app/credits">
                <IonIcon icon={cardOutline} />
                <IonLabel>Credits</IonLabel>
              </IonTabButton>

              <IonTabButton tab="subscriptions" href="/app/subscriptions">
                <IonIcon icon={walletOutline} />
                <IonLabel>Subscriptions</IonLabel>
              </IonTabButton>

              <IonTabButton tab="premise" href="/app/premise">
                <IonIcon icon={businessOutline} />
                <IonLabel>Premise</IonLabel>
              </IonTabButton>

              <IonTabButton tab="history" href="/app/history">
                <IonIcon icon={timeOutline} />
                <IonLabel>History</IonLabel>
              </IonTabButton>

              <IonTabButton tab="profile" href="/app/profile">
                <IonIcon icon={personOutline} />
                <IonLabel>Profile</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        ) : (
          // If on admin path but not admin, redirect or show error
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <p>Access denied. Admin privileges required.</p>
          </div>
        )}
      </main>

      {/* Global Toast Notifications */}
      <GlobalToast messages={toasts} onDismiss={dismissToast} />
    </div>
  );
};
