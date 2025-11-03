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
} from "ionicons/icons";
import "./TabsLayout.css";
import { useAdminStatus } from "@/hooks/AdminHooks";
import { useNotifications } from "@/hooks/useNotifications";

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

useIonViewDidEnter(()=>{
    if( pushPermission !== "granted"){
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
              <h2>Sunny Side Up Admin</h2>
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
{/* 
            <button 
              onClick={() => navigateTo('/app/admin/premise')} 
              className={`sidebar-item ${isActiveRoute('/app/admin/premise') ? 'active' : ''}`}
            >
              <IonIcon icon={homeOutline} />
              <span>Premise Management</span>
            </button> */}

            <button 
              onClick={() => navigateTo('/app/admin/tables')} 
              className={`sidebar-item ${isActiveRoute('/app/admin/tables') ? 'active' : ''}`}
            >
              <IonIcon icon={tabletPortraitSharp} />
              <span>Table's Management</span>
            </button>

            <button 
              onClick={() => navigateTo('/app/admin/transactions')} 
              className={`sidebar-item ${isActiveRoute('/app/admin/transactions') ? 'active' : ''}`}
            >
              <IonIcon icon={listOutline} />
              <span>Transactions</span>
            </button>

            <button 
              onClick={() => navigateTo('/app/admin/users')} 
              className={`sidebar-item ${isActiveRoute('/app/admin/users') ? 'active' : ''}`}
            >
              <IonIcon icon={peopleCircle} />
              <span>Users</span>
            </button>
{/* 
            <button 
              onClick={() => navigateTo('/app/admin/credits')} 
              className={`sidebar-item ${isActiveRoute('/app/admin/credits') ? 'active' : ''}`}
            >
              <IonIcon icon={walletOutline} />
              <span>Credits & Promos</span>
            </button> */}

            <button 
              onClick={() => navigateTo('/app/admin/reports')} 
              className={`sidebar-item ${isActiveRoute('/app/admin/reports') ? 'active' : ''}`}
            >
              <IonIcon icon={listCircleOutline} />
              <span>Reports</span>
            </button>

            {/* <button 
              onClick={() => navigateTo('/app/admin/wifi')} 
              className={`sidebar-item ${isActiveRoute('/app/admin/wifi') ? 'active' : ''}`}
            >
              <IonIcon icon={wifiOutline} />
              <span>WiFi Portal</span>
            </button> */}

            <button 
              onClick={() => navigateTo('/app/admin/global-settings')} 
              className={`sidebar-item ${isActiveRoute('/app/admin/global-settings') ? 'active' : ''}`}
            >
              <IonIcon icon={settingsOutline} />
              <span>Settings</span>
            </button>

            <button 
              onClick={() => navigateTo('/app/admin/rate-management')} 
              className={`sidebar-item ${isActiveRoute('/app/admin/rate-management') ? 'active' : ''}`}
            >
              <IonIcon icon={cashOutline} />
              <span>Rate Management</span>
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
    </div>
  );
};
