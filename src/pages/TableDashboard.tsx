import React from "react";
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from "@ionic/react";
import {
  TableManagementServiceAPI,
  useTablesManagement,
} from "../hooks/AdminDataHooks";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { ErrorMessage } from "../components/common/ErrorMessage";
import { useConfirmation } from "../hooks/useConfirmation";
import { ConfirmToast } from "../components/common/ConfirmToast";
import { useNotifications } from "../hooks/useNotifications";
import "../Admin/styles/admin.css";
import "../Admin/styles/admin-responsive.css";
import { useTable } from "@/shared/DynamicTable/DynamicTable";
import { SessionTimer } from "@/components/common/SessionTimer";
import { tableService } from "@/services/table.service";
import { useHourlyRate } from "../hooks/GlobalSettingsHooks";
import { useMutation } from "@tanstack/react-query";

const TableDashboard: React.FC = () => {
  console.log('TableDashboard component is rendering...');
  
  // Get hourly rate from global settings
  const { hourlyRate } = useHourlyRate();
  
  // Simple fallback content
  const [showFallback, setShowFallback] = React.useState(false);
  
  React.useEffect(() => {
    // Show fallback after 3 seconds if still loading
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const {
    tables,
    isLoading,
    error,
    refetch,
  } = useTablesManagement();
  
  const {
    tableState,
    updateState,
    data,
    isLoading: IsLoadingtable,
    isError,
    error: IsErrorTable,
    refetch: RefetchTable,
    isFetching,
  } = useTable({
    queryKey: "dashboard-table",
    fetchFn: TableManagementServiceAPI.fetchTables,
    initialState: { pageSize: 50 },
  });

  // Confirmation hook
  const {
    isOpen: isConfirmOpen,
    options: confirmOptions,
    showConfirmation,
    handleConfirm: confirmAction,
    handleCancel: cancelAction,
    handleDismiss: dismissConfirm
  } = useConfirmation();

  // Notifications hook
  const {
    showLocalNotification
  } = useNotifications();

  // Auto-refresh table data every 30 seconds to keep timers in sync
  React.useEffect(() => {
    const interval = setInterval(() => {
      RefetchTable();
    }, 30000);

    return () => clearInterval(interval);
  }, [RefetchTable]);

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    Promise.all([RefetchTable(), refetch()]).finally(() => {
      event.detail.complete();
    });
  };

  // Show fallback dashboard if loading too long
  if ((isLoading || IsLoadingtable) && showFallback) {
    return (
      <IonContent style={{ height: '100vh', background: '#f5f5f5' }}>
        <div style={{ padding: '20px', minHeight: '100%' }}>
          <div style={{ marginBottom: '16px' }}>
            <h1 style={{ color: 'var(--ion-color-primary)', margin: '0 0 4px 0', fontSize: '28px' }}>📊 Table Dashboard</h1>
            <p style={{ color: 'black', margin: '0', fontSize: '16px' }}>Real-time table monitoring and management</p>
          </div>
          
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <LoadingSpinner message="Loading dashboard data..." />
            <p style={{ marginTop: '10px', color: '#666' }}>Taking longer than expected. The dashboard is loading...</p>
          </div>
        </div>
      </IonContent>
    );
  }

  if (isLoading || IsLoadingtable) {
    return (
      <IonContent style={{ height: '100vh', background: '#f5f5f5' }}>
        <div style={{ padding: '20px', minHeight: '100%' }}>
          <div style={{ marginBottom: '16px' }}>
            <h1 style={{ color: 'var(--ion-color-primary)', margin: '0 0 4px 0', fontSize: '28px' }}>📊 Table Dashboard</h1>
            <p style={{ color: 'black', margin: '0', fontSize: '16px' }}>Real-time table monitoring and management</p>
          </div>
          <LoadingSpinner message="Loading dashboard..." />
        </div>
      </IonContent>
    );
  }

  if (error || isError) {
    return (
      <IonContent style={{ height: '100vh', background: '#f5f5f5' }}>
        <div style={{ padding: '20px', minHeight: '100%' }}>
          <div style={{ marginBottom: '16px' }}>
            <h1 style={{ color: 'var(--ion-color-primary)', margin: '0 0 4px 0', fontSize: '28px' }}>📊 Table Dashboard</h1>
            <p style={{ color: 'black', margin: '0', fontSize: '16px' }}>Real-time table monitoring and management</p>
          </div>
          <ErrorMessage 
            message="Failed to load dashboard data" 
            onRetry={() => {
              refetch();
              RefetchTable();
            }} 
          />
        </div>
      </IonContent>
    );
  }

  return (
    <IonContent style={{ height: '100vh', background: '#f5f5f5' }}>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      <div className="tables-management" style={{ padding: '20px', minHeight: '100%' }}>
        <div className="dashboard-section">
          <div className="page-header" style={{ marginBottom: '16px' }}>
            <h1 style={{ color: 'var(--ion-color-primary)', margin: '0 0 4px 0', fontSize: '28px' }}>📊 Table Dashboard</h1>
            <p style={{ color: 'black', margin: '0', fontSize: '16px' }}>Real-time table monitoring and management</p>
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid" style={{ marginTop: '16px' }}>
            <div className="stat-card available">
              <div className="stat-icon">○</div>
              <div className="stat-content">
                <h3>{data?.data?.filter((table: any) => !table.isOccupied && !table.isDisabled).length || 0}</h3>
                <p>Available</p>
              </div>
            </div>
            <div className="stat-card occupied">
              <div className="stat-icon">●</div>
              <div className="stat-content">
                <h3>{data?.data?.filter((table: any) => table.isOccupied).length || 0}</h3>
                <p>Occupied</p>
              </div>
            </div>
            <div className="stat-card disabled">
              <div className="stat-icon">◐</div>
              <div className="stat-content">
                <h3>{data?.data?.filter((table: any) => table.isDisabled).length || 0}</h3>
                <p>Disabled</p>
              </div>
            </div>
            <div className="stat-card total">
              <div className="stat-icon">◯</div>
              <div className="stat-content">
                <h3>{data?.data?.length || 0}</h3>
                <p>Total</p>
              </div>
            </div>
        </div>
          {/* Cinema-style Table Grid */}
          <div className="cinema-grid-container">
            <h3 style={{ color: 'var(--ion-color-secondary)', marginBottom: '12px', fontSize: '18px' }}>Table Status</h3>
            <div className="cinema-grid">
              {data?.data?.map((table: any) => (
                <div
                  key={table.id}
                  className={`cinema-seat ${
                    table.isDisabled ? 'disabled' : 
                    table.isOccupied ? 'occupied' : 'available'
                  }`}
                  onClick={() => !table.isDisabled && console.log('Table clicked:', table)}
                  title={`Table ${table.tableNumber} - ${table.location}\n${
                    table.isDisabled ? 'Disabled' : 
                    table.isOccupied ? `Occupied${table.currentSession?.user ? ` by ${table.currentSession.user.firstName} ${table.currentSession.user.lastName}` : ''}` : 
                    'Available'
                  }\nRate: ${hourlyRate} credits/hour\nCapacity: ${table.capacity} people`}
                >
                  <div className="table-number">{table.tableNumber}</div>
                  {!table.isOccupied ? (
                    <div className="table-status">
                      {table.isDisabled ? 'Disabled' : 'Available'}
                    </div>
                  ) : (
                    <>
                      <div className="table-status">Occupied</div>
                      {table.currentSession?.endTime && (
                        <div className="table-timer">
                          <SessionTimer
                            endTime={table.currentSession.endTime}
                            onTimeUp={() => console.log(`Session time up for table ${table.tableNumber}`)}
                            compact={true}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            
            {(!data?.data || data.data.length === 0) && (
              <div className="empty-state" style={{ textAlign: 'center', padding: '20px' }}>
                <h4 style={{ color: 'black', margin: '0 0 8px 0' }}>No tables found</h4>
                <p style={{ color: 'black', margin: '0', fontSize: '14px' }}>No study tables are currently configured</p>
              </div>
            )}
          </div>


          {/* Recent Activity */}
          <div className="recent-activity" style={{ marginTop: '20px' }}>
            <h3 style={{ color: 'var(--ion-color-secondary)', marginBottom: '12px', fontSize: '18px' }}>Active Sessions</h3>
            <div className="activity-list">
              {data?.data?.filter((table: any) => table.currentSession).slice(0, 10).map((table: any) => (
                <div key={table.id} className="activity-item">
                  <div className="activity-icon">●</div>
                  <div className="activity-content">
                    <div className="activity-main">
                      <strong>Table {table.tableNumber}</strong> - Session Active
                    </div>
                    <div className="activity-details">
                      User: {table.currentSession?.user?.firstName} {table.currentSession?.user?.lastName} | 
                      Location: {table.location} | 
                      Rate: {hourlyRate} credits/hour | 
                      Capacity: {table.capacity} people
                    </div>
                    <div className="activity-time">
                      {table.currentSession?.endTime && (
                        <SessionTimer
                          endTime={table.currentSession.endTime}
                          onTimeUp={() => console.log(`Session time up for table ${table.tableNumber}`)}
                          compact={true}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )) || (
                <div className="activity-item">
                  <div className="activity-icon">○</div>
                  <div className="activity-content">
                    <div className="activity-main">No active sessions</div>
                    <div className="activity-details">All tables are currently available for booking</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="summary-section" style={{ marginTop: '20px' }}>
            <div className="cinema-grid-container">
              <h3 style={{ color: 'var(--ion-color-secondary)', marginBottom: '12px', fontSize: '18px' }}>Analytics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                  <h4 style={{ color: 'var(--ion-color-primary)', marginBottom: '8px', fontSize: '14px' }}>Occupancy Rate</h4>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'black' }}>
                    {data?.data?.length ? Math.round((data.data.filter((t: any) => t.isOccupied).length / data.data.filter((t: any) => !t.isDisabled).length) * 100) : 0}%
                  </div>
                  <p style={{ color: 'black', fontSize: '12px', margin: '4px 0 0 0', opacity: 0.7 }}>
                    of available tables
                  </p>
                </div>
                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                  <h4 style={{ color: 'var(--ion-color-primary)', marginBottom: '8px', fontSize: '14px' }}>Active Revenue</h4>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'black' }}>
                    {(data?.data?.filter((t: any) => t.isOccupied).length || 0) * hourlyRate}
                  </div>
                  <p style={{ color: 'black', fontSize: '12px', margin: '4px 0 0 0', opacity: 0.7 }}>
                    credits per hour
                  </p>
                </div>
                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                  <h4 style={{ color: 'var(--ion-color-primary)', marginBottom: '8px', fontSize: '14px' }}>Average Session</h4>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'black' }}>
                    {data?.data?.filter((t: any) => t.currentSession).length ? 
                      Math.round(data.data.filter((t: any) => t.currentSession).reduce((sum: number, t: any) => sum + (t.currentSession?.duration || 0), 0) / data.data.filter((t: any) => t.currentSession).length * 10) / 10 : 0}h
                  </div>
                  <p style={{ color: 'black', fontSize: '12px', margin: '4px 0 0 0', opacity: 0.7 }}>
                    hours per session
                  </p>
                </div>
                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                  <h4 style={{ color: 'var(--ion-color-primary)', marginBottom: '8px', fontSize: '14px' }}>Peak Hours</h4>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'black' }}>
                    {new Date().getHours() >= 14 && new Date().getHours() <= 18 ? 'NOW' : '2-6 PM'}
                  </div>
                  <p style={{ color: 'black', fontSize: '12px', margin: '4px 0 0 0', opacity: 0.7 }}>
                    busiest time period
                  </p>
                </div>
                <div style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
                  <h4 style={{ color: 'var(--ion-color-primary)', marginBottom: '8px', fontSize: '14px' }}>Efficiency</h4>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'black' }}>
                    {data?.data?.length ? Math.round(((data.data.filter((t: any) => t.isOccupied).length / data.data.length) * 100)) : 0}%
                  </div>
                  <p style={{ color: 'black', fontSize: '12px', margin: '4px 0 0 0', opacity: 0.7 }}>
                    table utilization
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
  );
};

export default TableDashboard;