// src/App.tsx
import React from "react";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Redirect } from "react-router-dom";
import { QueryProvider } from "./providers/QueryProvier";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variable.css";
// import './theme/global.css';

/* Pages */
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import TableScanner from "./pages/dashboard/TableScanner";
import TableDetails from "./pages/tables/TableDetails";
import Credits from "./pages/credits/credits";
import PremiseAccess from "./pages/premise/PremiseAccess";
import Profile from "./pages/profile/Profile";
import History from "./pages/history/History";

/* Components */
import { AuthGuard } from "./components/guards/AuthGuard";
import { TabsLayout } from "./components/Layout/TabsLayout";
import { PushNotificationInitializer } from "./components/notifications/PushNotificationInitializer";

/* Admin Components */
import { AdminLogin } from "./Admin/AdminLogin";
import { PremiseManagement } from "./Admin/PremiseManagement";

/* Admin Pages */
import TableDashboard from "./pages/TableDashboard";
import TablesManagement from "./pages/TableManagement";
import TransactionsManagement from "./pages/TransactionManagement";
import UsersManagement from "./pages/UserManagement";
import CreditsManagement from "./pages/CreditsManagement";
import CreditsManagementPromos from "./pages/CreditsManagementPromos";
import ReportsPage from "./pages/ReportsPage";
import WiFiPortal from "./pages/WiFiPortal";
import PublicWiFiPortal from "./pages/PublicWiFiPortal";
import GlobalSettings from "./pages/GlobalSettings";
import RateManagement from "./pages/RateManagement";
setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <PushNotificationInitializer />
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Public Routes */}
        <Route exact path="/login" component={Login} />
        <Route exact path="/register" component={Register} />
        <Route exact path="/admin/login" component={AdminLogin} />
        <Route exact path="/wifi" component={PublicWiFiPortal} />

        {/* Protected Routes with Regular Tabs */}
        <Route path="/app">
          <AuthGuard>
            <TabsLayout>
              <Route exact path="/app/dashboard" component={Dashboard} />
              <Route exact path="/app/scanner" component={TableScanner} />
              <Route exact path="/app/table/:id" component={TableDetails} />
              <Route exact path="/app/credits" component={Credits} />
              <Route exact path="/app/premise" component={PremiseAccess} />
              <Route exact path="/app/history" component={History} />
              <Route exact path="/app/profile" component={Profile} />
              
              {/* Admin Routes */}
              <Route exact path="/app/admin/premise" component={PremiseManagement} />
              <Route exact path="/app/admin/dashboard" component={TableDashboard} />
              <Route exact path="/app/admin/tables" component={TablesManagement} />
              <Route exact path="/app/admin/transactions" component={TransactionsManagement} />
              <Route exact path="/app/admin/users" component={UsersManagement} />
              <Route exact path="/app/admin/credits/promos" component={CreditsManagementPromos} />
              <Route exact path="/app/admin/credits" component={CreditsManagement} />
              <Route exact path="/app/admin/reports" component={ReportsPage} />
              <Route exact path="/app/admin/wifi" component={WiFiPortal} />
              <Route exact path="/app/admin/global-settings" component={GlobalSettings} />
              <Route exact path="/app/admin/rate-management" component={RateManagement} />
              <Route exact path="/app/admin/profile" component={Profile} />

              <Route exact path="/app">
                <Redirect to="/app/dashboard" />
              </Route>
            </TabsLayout>
          </AuthGuard>
        </Route>

        {/* Default redirect */}
        <Route exact path="/">
          <Redirect to="/app/dashboard" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
