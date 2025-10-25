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
  IonTitle,
  IonProgressBar,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import {
  statsChartOutline,
  calendarOutline,
  downloadOutline,
  cashOutline,
  trendingUpOutline,
  cardOutline,
  peopleOutline,
  timeOutline,
  checkmarkCircleOutline,
  hourglassOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { apiClient } from '../services/api.client';
import { ApiResponseSchema } from '../schema/api.schema';
import { PesoFormat } from '../shared/PesoHelper';
import './ReportsPage.css';

type ReportPeriod = 'Daily' | 'Weekly' | 'Monthly';

// Enhanced schemas for report data
const TransactionSummarySchema = z.object({
  totalTransactions: z.number(),
  totalAmount: z.number(),
  approvedCount: z.number(),
  pendingCount: z.number(),
  rejectedCount: z.number().optional(),
  averageAmount: z.number().optional(),
});

const StatusBreakdownSchema = z.object({
  status: z.string(),
  count: z.number(),
  totalAmount: z.number(),
  percentage: z.number(),
});

const TopUserSchema = z.object({
  userId: z.string(),
  userName: z.string().nullable(),
  userEmail: z.string(),
  transactionCount: z.number(),
  totalAmount: z.number(),
});

const TransactionReportSchema = z.object({
  summary: TransactionSummarySchema,
  byStatus: z.array(StatusBreakdownSchema),
  topUsers: z.array(TopUserSchema),
  period: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

const TransactionReportResponseSchema = z.object({
  report: TransactionReportSchema,
  generatedAt: z.string(),
});

const QuickStatsSchema = z.object({
  today: z.object({
    transactions: z.number(),
    amount: z.number(),
    approved: z.number(),
    pending: z.number(),
  }),
  thisWeek: z.object({
    transactions: z.number(),
    amount: z.number(),
    approved: z.number(),
    pending: z.number(),
  }),
  thisMonth: z.object({
    transactions: z.number(),
    amount: z.number(),
    approved: z.number(),
    pending: z.number(),
  }),
});

 const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('Daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');
  const [isExporting, setIsExporting] = useState(false);

  const showMessage = (message: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  // Quick stats query
  const quickStatsQuery = useQuery({
    queryKey: ['quickStats'],
    queryFn: async () => {
      return await apiClient.get('report/transactions/quick-stats', ApiResponseSchema(QuickStatsSchema));
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setIsExporting(true);
      
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

      // Use the export endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://3qrbqpcx-5212.asse.devtunnels.ms/'}api/report/transactions/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      if (format === 'csv') {
        const csvText = await response.text();
        const blob = new Blob([csvText], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transaction_report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        const jsonData = await response.json();
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
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
    } finally {
      setIsExporting(false);
    }
  };

  const periods = [
    { label: 'Daily', value: 'Daily' as ReportPeriod },
    { label: 'Weekly', value: 'Weekly' as ReportPeriod },
    { label: 'Monthly', value: 'Monthly' as ReportPeriod },
  ];

  const buildEndpoint = useCallback(() => {
    if (selectedPeriod === 'Daily') {
      return `report/transactions/daily?date=${selectedDate}`;
    } else if (selectedPeriod === 'Weekly') {
      return `report/transactions/weekly?weekStartDate=${selectedDate}`;
    } else if (selectedPeriod === 'Monthly') {
      return `report/transactions/monthly?year=${selectedYear}&month=${selectedMonth}`;
    }
    return 'report/transactions/daily';
  }, [selectedPeriod, selectedDate, selectedYear, selectedMonth]);

  const reportQuery = useQuery({
    queryKey: ['transactionReport', selectedPeriod, selectedDate, selectedYear, selectedMonth],
    queryFn: async () => {
      const endpoint = buildEndpoint();
      return await apiClient.get(endpoint, ApiResponseSchema(TransactionReportResponseSchema));
    },
    enabled: false,
  });

  const { data: report, isLoading, error } = reportQuery;
  const { data: quickStats, isLoading: statsLoading } = quickStatsQuery;

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
        <IonRefresher slot="fixed" onIonRefresh={(e) => {
          quickStatsQuery.refetch();
          e.detail.complete();
        }}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="reports-container">
          {/* Quick Stats Dashboard */}
          <IonCard className="quick-stats-card">
            <IonCardHeader>
              <IonCardTitle >
                <IonIcon icon={trendingUpOutline} style={{ marginRight: '8px', color: 'rgb(57, 53, 53)' }} />
                <strong className='quick-stats-card-title'>Quick Statistics</strong>
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {statsLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <IonSpinner name="crescent" />
                  <p>Loading statistics...</p>
                </div>
              ) : quickStats ? (
                <IonGrid>
                  <IonRow>
                    <IonCol size="12" sizeMd="4">
                      <div className="stat-period">
                        <h3>
                          <IonIcon icon={timeOutline} />
                          Today
                        </h3>
                        <div className="stat-grid">
                          <div className="stat-item">
                            <IonIcon icon={cashOutline} />
                            <div>
                              <span className="stat-value">{quickStats.today.transactions}</span>
                              <span className="stat-label">Transactions</span>
                            </div>
                          </div>
                          <div className="stat-item">
                            <IonIcon icon={trendingUpOutline} />
                            <div>
                              <span className="stat-value">{PesoFormat(quickStats.today.amount)}</span>
                              <span className="stat-label">Total Amount</span>
                            </div>
                          </div>
                          <div className="stat-item">
                            <IonIcon icon={checkmarkCircleOutline} />
                            <div>
                              <span className="stat-value">{quickStats.today.approved}</span>
                              <span className="stat-label">Approved</span>
                            </div>
                          </div>
                          <div className="stat-item">
                            <IonIcon icon={hourglassOutline} />
                            <div>
                              <span className="stat-value">{quickStats.today.pending}</span>
                              <span className="stat-label">Pending</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </IonCol>
                    <IonCol size="12" sizeMd="4">
                      <div className="stat-period">
                        <h3>
                          <IonIcon icon={calendarOutline} />
                          This Week
                        </h3>
                        <div className="stat-grid">
                          <div className="stat-item">
                            <IonIcon icon={cashOutline} />
                            <div>
                              <span className="stat-value">{quickStats.thisWeek.transactions}</span>
                              <span className="stat-label">Transactions</span>
                            </div>
                          </div>
                          <div className="stat-item">
                            <IonIcon icon={trendingUpOutline} />
                            <div>
                              <span className="stat-value">{PesoFormat(quickStats.thisWeek.amount)}</span>
                              <span className="stat-label">Total Amount</span>
                            </div>
                          </div>
                          <div className="stat-item">
                            <IonIcon icon={checkmarkCircleOutline} />
                            <div>
                              <span className="stat-value">{quickStats.thisWeek.approved}</span>
                              <span className="stat-label">Approved</span>
                            </div>
                          </div>
                          <div className="stat-item">
                            <IonIcon icon={hourglassOutline} />
                            <div>
                              <span className="stat-value">{quickStats.thisWeek.pending}</span>
                              <span className="stat-label">Pending</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </IonCol>
                    <IonCol size="12" sizeMd="4">
                      <div className="stat-period">
                        <h3>
                          <IonIcon icon={statsChartOutline} />
                          This Month
                        </h3>
                        <div className="stat-grid">
                          <div className="stat-item">
                            <IonIcon icon={cashOutline} />
                            <div>
                              <span className="stat-value">{quickStats.thisMonth.transactions}</span>
                              <span className="stat-label">Transactions</span>
                            </div>
                          </div>
                          <div className="stat-item">
                            <IonIcon icon={trendingUpOutline} />
                            <div>
                              <span className="stat-value">{PesoFormat(quickStats.thisMonth.amount)}</span>
                              <span className="stat-label">Total Amount</span>
                            </div>
                          </div>
                          <div className="stat-item">
                            <IonIcon icon={checkmarkCircleOutline} />
                            <div>
                              <span className="stat-value">{quickStats.thisMonth.approved}</span>
                              <span className="stat-label">Approved</span>
                            </div>
                          </div>
                          <div className="stat-item">
                            <IonIcon icon={hourglassOutline} />
                            <div>
                              <span className="stat-value">{quickStats.thisMonth.pending}</span>
                              <span className="stat-label">Pending</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p>Unable to load quick statistics</p>
                </div>
              )}
            </IonCardContent>
          </IonCard>

          <IonCard className="report-controls-card">
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={calendarOutline} style={{ marginRight: '8px' }} />
                Detailed Report Configuration
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
                <LoadingSpinner message="Generating detailed report..." />
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
                  <IonCardTitle>
                    <IonIcon icon={downloadOutline} style={{ marginRight: '8px' }} />
                    Export Options
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="6">
                        <IonButton 
                          expand="block" 
                          fill="outline" 
                          onClick={() => handleExport('csv')}
                          disabled={isExporting}
                        >
                          <IonIcon icon={downloadOutline} slot="start" />
                          {isExporting ? 'Exporting...' : 'Export CSV'}
                        </IonButton>
                      </IonCol>
                      <IonCol size="6">
                        <IonButton 
                          expand="block" 
                          fill="outline" 
                          onClick={() => handleExport('json')}
                          disabled={isExporting}
                        >
                          <IonIcon icon={downloadOutline} slot="start" />
                          {isExporting ? 'Exporting...' : 'Export JSON'}
                        </IonButton>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                  {isExporting && <IonProgressBar type="indeterminate" />}
                </IonCardContent>
              </IonCard>

              {/* Report Summary */}
              {report.report?.summary && (
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>
                      <IonIcon icon={statsChartOutline} style={{ marginRight: '8px' }} />
                      {selectedPeriod} Report Summary
                      <IonBadge slot="end" color="primary">
                        {new Date(report.generatedAt).toLocaleString()}
                      </IonBadge>
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
                              <div className="summary-value">{report.report.summary.totalTransactions}</div>
                            </div>
                          </div>
                        </IonCol>
                        <IonCol size="6" sizeMd="3">
                          <div className="summary-item">
                            <IonIcon icon={trendingUpOutline} className="summary-icon" />
                            <div className="summary-content">
                              <div className="summary-label">Total Amount</div>
                              <div className="summary-value">{PesoFormat(report.report.summary.totalAmount)}</div>
                            </div>
                          </div>
                        </IonCol>
                        <IonCol size="6" sizeMd="3">
                          <div className="summary-item">
                            <IonIcon icon={checkmarkCircleOutline} className="summary-icon" color="success" />
                            <div className="summary-content">
                              <div className="summary-label">Approved</div>
                              <div className="summary-value">{report.report.summary.approvedCount}</div>
                            </div>
                          </div>
                        </IonCol>
                        <IonCol size="6" sizeMd="3">
                          <div className="summary-item">
                            <IonIcon icon={hourglassOutline} className="summary-icon" color="warning" />
                            <div className="summary-content">
                              <div className="summary-label">Pending</div>
                              <div className="summary-value">{report.report.summary.pendingCount}</div>
                            </div>
                          </div>
                        </IonCol>
                        {report.report.summary.rejectedCount !== undefined && (
                          <IonCol size="6" sizeMd="3">
                            <div className="summary-item">
                              <IonIcon icon={closeCircleOutline} className="summary-icon" color="danger" />
                              <div className="summary-content">
                                <div className="summary-label">Rejected</div>
                                <div className="summary-value">{report.report.summary.rejectedCount}</div>
                              </div>
                            </div>
                          </IonCol>
                        )}
                        {report.report.summary.averageAmount !== undefined && (
                          <IonCol size="6" sizeMd="3">
                            <div className="summary-item">
                              <IonIcon icon={trendingUpOutline} className="summary-icon" color="secondary" />
                              <div className="summary-content">
                                <div className="summary-label">Average Amount</div>
                                <div className="summary-value">{PesoFormat(report.report.summary.averageAmount)}</div>
                              </div>
                            </div>
                          </IonCol>
                        )}
                      </IonRow>
                    </IonGrid>
                  </IonCardContent>
                </IonCard>
              )}

              {/* Status Distribution */}
              {report.report?.byStatus && report.report.byStatus.length > 0 && (
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>
                      <IonIcon icon={cardOutline} style={{ marginRight: '8px' }} />
                      Status Distribution
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="table-container">
                      {report.report.byStatus.map((status, index: number) => (
                        <div key={index} className="table-row">
                          <div className="row-content">
                            <div className="row-main">
                              <IonBadge 
                                color={
                                  status.status.toLowerCase() === 'approved' ? 'success' : 
                                  status.status.toLowerCase() === 'pending' ? 'warning' : 
                                  status.status.toLowerCase() === 'rejected' ? 'danger' : 'medium'
                                }
                              >
                                {status.status}
                              </IonBadge>
                              <span className="row-count">{status.count} transactions</span>
                            </div>
                            <div className="row-details">
                              <span className="row-amount">{PesoFormat(status.totalAmount)}</span>
                              <span className="row-percentage">{status.percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </IonCardContent>
                </IonCard>
              )}

              {/* Top Users */}
              {report.report?.topUsers && report.report.topUsers.length > 0 && (
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>
                      <IonIcon icon={peopleOutline} style={{ marginRight: '8px' }} />
                      Top Users
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="top-users-list">
                      {report.report.topUsers.map((user, index: number) => (
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

              {/* Report Metadata */}
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Report Details</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="report-metadata">
                    <div className="metadata-item">
                      <strong>Period:</strong> {report.report.period}
                    </div>
                    <div className="metadata-item">
                      <strong>Date Range:</strong> {new Date(report.report.startDate).toLocaleDateString()} - {new Date(report.report.endDate).toLocaleDateString()}
                    </div>
                    <div className="metadata-item">
                      <strong>Generated At:</strong> {new Date(report.generatedAt).toLocaleString()}
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </div>
          ) : (
            <IonCard>
              <IonCardContent>
                <div className="no-report">
                  <IonIcon icon={statsChartOutline} size="large" />
                  <h3>No Report Data</h3>
                  <p>Select a period and generate a report to view detailed transaction data</p>
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