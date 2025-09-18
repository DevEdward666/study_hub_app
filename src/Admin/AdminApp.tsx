import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
import { QueryProvider } from "../providers/QueryProvier";
import { AdminAuthGuard } from "../components/AdminAuthGuard";
import { AdminLayout } from "../components/AdminLayout";
import { AdminLogin } from "../Admin/AdminLogin";
import Dashboard from "../pages/dashboard/Dashboard";
import UsersManagement from "../pages/UserManagement";
import TransactionsManagement from "../pages/TransactionManagement";
import TablesManagement from "../pages/TableManagement";
import { PremiseManagement } from "../Admin/PremiseManagement";
import "./styles/admin.css";

const AdminApp: React.FC = () => {
  return (
    <div className="admin-app">
      <QueryProvider>
        <Router basename="/admin">
          <Switch>
            <Route exact path="/login" component={AdminLogin} />

            <Route path="/">
              <AdminAuthGuard>
                <AdminLayout>
                  <Switch>
                    <Route exact path="/dashboard" component={Dashboard} />
                    <Route exact path="/users" component={UsersManagement} />
                    <Route
                      exact
                      path="/transactions"
                      component={TransactionsManagement}
                    />
                    <Route exact path="/tables" component={TablesManagement} />
                    <Route
                      exact
                      path="/premise"
                      component={PremiseManagement}
                    />
                    <Route exact path="/">
                      <Redirect to="/dashboard" />
                    </Route>
                  </Switch>
                </AdminLayout>
              </AdminAuthGuard>
            </Route>
          </Switch>
        </Router>
      </QueryProvider>
    </div>
  );
};

export default AdminApp;
