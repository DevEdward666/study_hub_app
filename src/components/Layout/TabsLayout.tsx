import React from "react";
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from "@ionic/react";
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
} from "ionicons/icons";
import "./TabsLayout.css";
import { useAdminStatus } from "@/hooks/AdminHooks";

interface TabsLayoutProps {
  children: React.ReactNode;
}

export const TabsLayout: React.FC<TabsLayoutProps> = ({ children }) => {
  const { refetch: refetchAdminStatus, isAdmin } = useAdminStatus();
  const isAdminPath = window.location.pathname.includes("/admin");
  return (
    <IonTabs>
      <IonRouterOutlet>{children}</IonRouterOutlet>

      {isAdmin && isAdminPath ? (
        <IonTabBar slot="bottom" className="tabs-bar">
          <IonTabButton tab="dashboard" href="/app/admin/premise">
            <IonIcon icon={homeOutline} />
            <IonLabel>Premise Management</IonLabel>
          </IonTabButton>

          <IonTabButton tab="scanner" href="/app/admin/tables">
            <IonIcon icon={tabletPortraitSharp} />
            <IonLabel>Table's Management</IonLabel>
          </IonTabButton>

          <IonTabButton tab="credits" href="/app/admin/transactions">
            <IonIcon icon={listOutline} />
            <IonLabel>Transactions</IonLabel>
          </IonTabButton>

          <IonTabButton tab="premise" href="/app/admin/users">
            <IonIcon icon={peopleCircle} />
            <IonLabel>Users</IonLabel>
          </IonTabButton>

          <IonTabButton tab="profile" href="/app/admin/profile">
            <IonIcon icon={personOutline} />
            <IonLabel>Profile</IonLabel>
          </IonTabButton>
        </IonTabBar>
      ) : (
        <IonTabBar slot="bottom" className="tabs-bar">
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
  );
};
