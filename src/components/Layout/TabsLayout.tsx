import React from 'react';
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/react';
import {
  homeOutline,
  qrCodeOutline,
  cardOutline,
  businessOutline,
  timeOutline,
  personOutline,
} from 'ionicons/icons';
import './TabsLayout.css';

interface TabsLayoutProps {
  children: React.ReactNode;
}

export const TabsLayout: React.FC<TabsLayoutProps> = ({ children }) => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        {children}
      </IonRouterOutlet>
      
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
    </IonTabs>
  );
};