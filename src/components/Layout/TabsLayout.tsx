import React from "react";
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  useIonViewDidEnter,
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
} from "ionicons/icons";
import "./TabsLayout.css";
import { useAdminStatus } from "@/hooks/AdminHooks";
import { useNotifications } from "@/hooks/useNotifications";

interface TabsLayoutProps {
  children: React.ReactNode;
}

export const TabsLayout: React.FC<TabsLayoutProps> = ({ children }) => {
  const { refetch: refetchAdminStatus, isAdmin } = useAdminStatus();
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
  console.log(pushPermission)
    if( pushPermission !== "granted"){
      requestPushPermission();
    }
  })
  const navigateTo = (path: string) => {
    history.push(path);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };
  return (
    <div className={`app-layout ${isAdmin && isAdminPath ? 'admin-layout' : 'user-layout'}`}>
      {isAdmin && isAdminPath && (
        <nav className="sidebar">
          <div className="sidebar-header">
            <h2>StudyHub Admin</h2>
          </div>
          <div className="sidebar-menu">
            <button 
              onClick={() => navigateTo('/app/admin/premise')} 
              className={`sidebar-item ${isActiveRoute('/app/admin/premise') ? 'active' : ''}`}
            >
              <IonIcon icon={homeOutline} />
              <span>Premise Management</span>
            </button>

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

            <button 
              onClick={() => navigateTo('/app/admin/reports')} 
              className={`sidebar-item ${isActiveRoute('/app/admin/reports') ? 'active' : ''}`}
            >
              <IonIcon icon={statsChartOutline} />
              <span>Reports</span>
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
      )}

      <main className="main-content">
        <IonTabs>
          <IonRouterOutlet>{children}</IonRouterOutlet>

          {isAdmin && isAdminPath ? (
            <IonTabBar slot="bottom" className="tabs-bar mobile-only">
              <IonTabButton tab="dashboard" href="/app/admin/premise">
                <IonIcon icon={homeOutline} />
                <IonLabel>Premise</IonLabel>
              </IonTabButton>

              <IonTabButton tab="scanner" href="/app/admin/tables">
                <IonIcon icon={tabletPortraitSharp} />
                <IonLabel>Tables</IonLabel>
              </IonTabButton>

              <IonTabButton tab="credits" href="/app/admin/transactions">
                <IonIcon icon={listOutline} />
                <IonLabel>Transactions</IonLabel>
              </IonTabButton>

              <IonTabButton tab="premise" href="/app/admin/users">
                <IonIcon icon={peopleCircle} />
                <IonLabel>Users</IonLabel>
              </IonTabButton>

              <IonTabButton tab="reports" href="/app/admin/reports">
                <IonIcon icon={statsChartOutline} />
                <IonLabel>Reports</IonLabel>
              </IonTabButton>

              <IonTabButton tab="profile" href="/app/admin/profile">
                <IonIcon icon={personOutline} />
                <IonLabel>Profile</IonLabel>
              </IonTabButton>
            </IonTabBar>
          ) : (
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
          )}
        </IonTabs>
      </main>
    </div>
  );
};
