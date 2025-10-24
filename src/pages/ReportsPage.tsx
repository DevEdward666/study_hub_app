import React, { useState, useCallback } from 'react';
import { 
  IonContent, 
  IonPage, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle, 
  IonButton, 
  IonIcon, 
  IonToast, 
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonBadge,
  IonHeader,
  IonToolbar,
  IonTitle
} from '@ionic/react';
import {
  statsChartOutline,
  calendarOutline,
  downloadOutline,
  cashOutline,
  trendingUpOutline,
  cardOutline,
  peopleOutline
} from 'ionicons/icons';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { apiClient } from '../configs/APIClient';
import { PesoFormat } from '../shared/PesoHelper';
import './ReportsPage.css';

type ReportPeriod = 'Daily' | 'Weekly' | 'Monthly';

// Simple schema for report data
const ReportSchema = z.any();

 const ReportsPage:React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('Daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  const showMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      let endpoint;
      let params: any = {
        format,
        period: selectedPeriod
      };

      if (selectedPeriod === 'Daily') {
        params.startDate = selectedDate;
        params.endDate = selectedDate;
      } else if (selectedPeriod === 'Weekly') {
        params.startDate = selectedDate;
        // Calculate end date for weekly report
        const startDate = new Date(selectedDate);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        params.endDate = endDate.toISOString().split('T')[0];
      } else if (selectedPeriod === 'Monthly') {
        // Calculate start and end dates for monthly report
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0);
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
      }

      const response = await apiClient.post('/api/report/transactions', ReportSchema, params);
      
      // Handle the response based on format
      if (format === 'csv') {
        // For CSV, the backend returns a file
        const blob = new Blob([response], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transaction_report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        // For JSON, create and download the file
        const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transaction_report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
      
      showMessage(`Report exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showMessage('Export failed', 'danger');
    }
  };

  const periods = [
    { label: 'Daily', value: 'Daily' as ReportPeriod },
    { label: 'Weekly', value: 'Weekly' as ReportPeriod },
    { label: 'Monthly', value: 'Monthly' as ReportPeriod },
  ];

  const buildEndpoint = useCallback(() => {
    if (selectedPeriod === 'Daily') {
      return `/api/report/transactions/daily?date=${selectedDate}`;
    } else if (selectedPeriod === 'Weekly') {
      return `/api/report/transactions/weekly?weekStartDate=${selectedDate}`;
    } else if (selectedPeriod === 'Monthly') {
      return `/api/report/transactions/monthly?year=${selectedYear}&month=${selectedMonth}`;
    }
    return '/api/report/transactions/daily';
  }, [selectedPeriod, selectedDate, selectedYear, selectedMonth]);

  const reportQuery = useQuery({
    queryKey: ['transactionReport', selectedPeriod, selectedDate, selectedYear, selectedMonth],
    queryFn: async () => {
      const fullEndpoint = buildEndpoint();
      const response = await apiClient.get(fullEndpoint, ReportSchema);
      return response;
    },
    enabled: false,
  });

  const { data: report, isLoading, error } = reportQuery;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <IonIcon icon={statsChartOutline} style={{ marginRight: '8px' }} />
            Reports & Analytics
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="reports-page">
        <div className="reports-container">
          <IonCard className="report-controls-card">
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={calendarOutline} style={{ marginRight: '8px' }} />
                Report Configuration
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="12" sizeMd="3">
                    <IonItem>
                      <IonLabel position="stacked">Report Period</IonLabel>
                      <IonSelect
                        value={selectedPeriod}
                        onIonChange={(e) => setSelectedPeriod(e.detail.value)}
                        interface="popover"
                      >
                        {periods.map((period) => (
                          <IonSelectOption key={period.value} value={period.value}>
                            {period.label}
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                  </IonCol>

                  <IonCol size="12" sizeMd="3">
                    {selectedPeriod === 'Daily' && (
                      <IonItem>
                        <IonLabel position="stacked">Select Date</IonLabel>
                        <IonInput
                          type="date"
                          value={selectedDate}
                          onIonInput={(e) => setSelectedDate(e.detail.value!)}
                        />
                      </IonItem>
                    )}
                    {selectedPeriod === 'Weekly' && (
                      <IonItem>
                        <IonLabel position="stacked">Week Starting</IonLabel>
                        <IonInput
                          type="date"
                          value={selectedDate}
                          onIonInput={(e) => setSelectedDate(e.detail.value!)}
                        />
                      </IonItem>
                    )}
                    {selectedPeriod === 'Monthly' && (
                      <IonItem>
                        <IonLabel position="stacked">Year</IonLabel>
                        <IonInput
                          type="number"
                          value={selectedYear}
                          onIonInput={(e) => setSelectedYear(parseInt(e.detail.value!, 10))}
                          min="2020"
                          max="2030"
                        />
                      </IonItem>
                    )}
                  </IonCol>

                  {selectedPeriod === 'Monthly' && (
                    <IonCol size="12" sizeMd="3">
                      <IonItem>
                        <IonLabel position="stacked">Month</IonLabel>
                        <IonSelect
                          value={selectedMonth}
                          onIonChange={(e) => setSelectedMonth(parseInt(e.detail.value))}
                          interface="popover"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <IonSelectOption key={month} value={month}>
                              {new Date(2000, month - 1).toLocaleString('en-US', { month: 'long' })}
                            </IonSelectOption>
                          ))}
                        </IonSelect>
                      </IonItem>
                    </IonCol>
                  )}

                  <IonCol size="12" sizeMd="3">
                    <IonButton 
                      expand="block" 
                      onClick={() => reportQuery.refetch()} 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <IonSpinner name="crescent" />
                          &nbsp; Loading...
                        </>
                      ) : (
                        <>
                          <IonIcon icon={statsChartOutline} slot="start" />
                          Generate Report
                        </>
                      )}
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

          {isLoading ? (
            <IonCard>
              <IonCardContent>
                <LoadingSpinner message="Generating report..." />
              </IonCardContent>
            </IonCard>
          ) : error ? (
            <IonCard>
              <IonCardContent>
                <ErrorMessage 
                  message={`Failed to load report data: ${error instanceof Error ? error.message : 'Unknown error'}`}
                  onRetry={() => reportQuery.refetch()}
                />
              </IonCardContent>
            </IonCard>
          ) : report ? (
            <div className="report-content">
              {/* Export buttons */}
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Export Options</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="6">
                        <IonButton 
                          expand="block" 
                          fill="outline" 
                          onClick={() => handleExport('csv')}
                        >
                          <IonIcon icon={downloadOutline} slot="start" />
                          Export CSV
                        </IonButton>
                      </IonCol>
                      <IonCol size="6">
                        <IonButton 
                          expand="block" 
                          fill="outline" 
                          onClick={() => handleExport('json')}
                        >
                          <IonIcon icon={downloadOutline} slot="start" />
                          Export JSON
                        </IonButton>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>

              {/* Report Summary */}
              {report.data?.report?.summary && (
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>
                      <IonIcon icon={statsChartOutline} style={{ marginRight: '8px' }} />
                      {selectedPeriod} Report Summary
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonGrid>
                      <IonRow>
                        <IonCol size="6" sizeMd="3">
                          <div className="summary-item">
                            <IonIcon icon={cashOutline} className="summary-icon" />
                            <div className="summary-content">
                              <div className="summary-label">Total Transactions</div>
                              <div className="summary-value">{report.data.report.summary.totalTransactions}</div>
                            </div>
                          </div>
                        </IonCol>
                        <IonCol size="6" sizeMd="3">
                          <div className="summary-item">
                            <IonIcon icon={trendingUpOutline} className="summary-icon" />
                            <div className="summary-content">
                              <div className="summary-label">Total Amount</div>
                              <div className="summary-value">{PesoFormat(report.data.report.summary.totalAmount)}</div>
                            </div>
                          </div>
                        </IonCol>
                        <IonCol size="6" sizeMd="3">
                          <div className="summary-item">
                            <IonIcon icon={cardOutline} className="summary-icon" />
                            <div className="summary-content">
                              <div className="summary-label">Approved</div>
                              <div className="summary-value">{report.data.report.summary.approvedCount}</div>
                            </div>
                          </div>
                        </IonCol>
                        <IonCol size="6" sizeMd="3">
                          <div className="summary-item">
                            <IonIcon icon={cardOutline} className="summary-icon" />
                            <div className="summary-content">
                              <div className="summary-label">Pending</div>
                              <div className="summary-value">{report.data.report.summary.pendingCount}</div>
                            </div>
                          </div>
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              )}

              {/* Status Distribution */}
              {report.data?.report?.byStatus && report.data.report.byStatus.length > 0 && (
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>
                      <IonIcon icon={peopleOutline} style={{ marginRight: '8px' }} />
                      Status Distribution
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="table-container">
                      {report.data.report.byStatus.map((status: any, index: number) => (
                        <div key={index} className="table-row">
                          <div className="row-content">
                            <div className="row-main">
                              <IonBadge 
                                color={status.status.toLowerCase() === 'approved' ? 'success' : 
                                       status.status.toLowerCase() === 'pending' ? 'warning' : 'danger'}
                              >
                                {status.status}
                              </IonBadge>
                              <span className="row-count">{status.count} transactions</span>
                            </div>
                            <div className="row-details">
                              <span className="row-amount">{PesoFormat(status.totalAmount)}</span>
                              <span className="row-percentage">{status.percentage?.toFixed(1) || '0.0'}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </IonCardContent>
                </IonCard>
              )}

              {/* Top Users */}
              {report.data?.report?.topUsers && report.data.report.topUsers.length > 0 && (
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>
                      <IonIcon icon={peopleOutline} style={{ marginRight: '8px' }} />
                      Top Users
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="top-users-list">
                      {report.data.report.topUsers.map((user: any, index: number) => (
                        <div key={user.userId} className="user-item">
                          <div className="user-rank">
                            <IonBadge color={index < 3 ? 'primary' : 'medium'}>
                              #{index + 1}
                            </IonBadge>
                          </div>
                          <div className="user-info">
                            <div className="user-name">{user.userName || 'N/A'}</div>
                            <div className="user-email">{user.userEmail}</div>
                          </div>
                          <div className="user-stats">
                            <div className="user-stat">
                              <span className="stat-value">{user.transactionCount}</span>
                              <span className="stat-label">Transactions</span>
                            </div>
                            <div className="user-stat">
                              <span className="stat-value">{PesoFormat(user.totalAmount)}</span>
                              <span className="stat-label">Total Amount</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </IonCardContent>
                </IonCard>
              )}

              {/* Raw Data Debug */}
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Report Data (Debug)</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <pre style={{fontSize: '12px', overflow: 'auto'}}>{JSON.stringify(report, null, 2)}</pre>
                </IonCardContent>
              </IonCard>
            </div>
          ) : (
            <IonCard>
              <IonCardContent>
                <div className="no-report">
                  <IonIcon icon={statsChartOutline} size="large" />
                  <h3>No Report Data</h3>
                  <p>Select a period and generate a report to view transaction data</p>
                </div>
              </IonCardContent>
            </IonCard>
          )}
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
}
export default ReportsPage;