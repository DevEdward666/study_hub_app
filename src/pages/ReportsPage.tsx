import React, { useState, useCallback } from 'react';
import {
  IonContent,
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
  IonProgressBar,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonNote,
  IonChip,
  RefresherEventDetail
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
  barChartOutline,
  pieChartOutline,
  analyticsOutline,
  starOutline,
  refreshOutline
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
type ReportView = 'overview' | 'detailed' | 'recommended';

// Enhanced schemas for report data
const TransactionSummarySchema = z.object({
  totalTransactions: z.number(),
  totalAmount: z.number(),
  averageAmount: z.number().optional(),
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
  }),
  thisWeek: z.object({
    transactions: z.number(),
    amount: z.number(),
  }),
  thisMonth: z.object({
    transactions: z.number(),
    amount: z.number(),
  }),
});

const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('Daily');
  const [selectedView, setSelectedView] = useState<ReportView>('overview');
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
    enabled: true, // Auto-load on mount and when dependencies change
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const { data: report, isLoading, error } = reportQuery;
  const { data: quickStats, isLoading: statsLoading } = quickStatsQuery;

  // Show loading state while initial data is loading
  if (isLoading || statsLoading) {
    return (
      <IonContent style={{ height: '100vh', background: '#f5f5f5' }}>
        <div style={{ padding: '20px', minHeight: '100%' }}>
          <div style={{ marginBottom: '16px' }}>
            <h1 style={{ color: 'var(--ion-color-primary)', margin: '0 0 4px 0', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IonIcon icon={statsChartOutline} />
              Reports & Analytics
            </h1>
            <p style={{ color: 'black', margin: '0', fontSize: '16px' }}>Financial reports and business insights</p>
          </div>
          <LoadingSpinner message="Loading reports..." />
        </div>
      </IonContent>
    );
  }

  return (
    <IonContent className="reports-page" style={{ '--background': '#f5f5f5' }}>
      <IonRefresher slot="fixed" onIonRefresh={(e) => {
        quickStatsQuery.refetch();
        reportQuery.refetch();
        e.detail.complete();
      }}>
        <IonRefresherContent />
      </IonRefresher>

      <div className="reports-container" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ padding: '20px', minHeight: '100%' }}>
          <div style={{ marginBottom: '16px' }}>
            <h1 style={{ color: 'var(--ion-color-primary)', margin: '0 0 4px 0', fontSize: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IonIcon icon={statsChartOutline} />
              Reports & Analytics
            </h1>
            <p style={{ color: 'black', margin: '0', fontSize: '16px' }}>Financial reports and business insights</p>
          </div>
        </div>
        {/* Quick Stats Dashboard */}
        <IonCard className="quick-stats-card" style={{ marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <IonCardHeader style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
            <IonCardTitle style={{ fontSize: '16px', fontWeight: 600, color: 'black', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '4px',
                height: '24px',
                background: 'var(--ion-color-primary)',
                borderRadius: '2px'
              }} />
              Quick Statistics
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
                    <div className="stat-period" style={{
                      background: 'var(--ion-color-primary)',
                      borderRadius: '12px',
                      padding: '20px',
                      color: 'white',
                      minHeight: '140px'
                    }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px', opacity: 0.9 }}>
                        Today
                      </h3>
                      <div className="stat-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="stat-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '28px', fontWeight: 700 }}>{quickStats.today.transactions}</div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>Transactions</div>
                          </div>
                        </div>
                        <div className="stat-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                          <div>
                            <div style={{ fontSize: '24px', fontWeight: 700 }}>{PesoFormat(quickStats.today.amount)}</div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>Total Amount</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </IonCol>
                  <IonCol size="12" sizeMd="4">
                    <div className="stat-period" style={{
                      background: 'var(--ion-color-secondary)',
                      borderRadius: '12px',
                      padding: '20px',
                      color: 'white',
                      minHeight: '140px'
                    }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px', opacity: 0.9 }}>
                        This Week
                      </h3>
                      <div className="stat-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="stat-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '28px', fontWeight: 700 }}>{quickStats.thisWeek.transactions}</div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>Transactions</div>
                          </div>
                        </div>
                        <div className="stat-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                          <div>
                            <div style={{ fontSize: '24px', fontWeight: 700 }}>{PesoFormat(quickStats.thisWeek.amount)}</div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>Total Amount</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </IonCol>
                  <IonCol size="12" sizeMd="4">
                    <div className="stat-period" style={{
                      background: 'var(--ion-color-primary)',
                      borderRadius: '12px',
                      padding: '20px',
                      color: 'white',
                      minHeight: '140px'
                    }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px', opacity: 0.9 }}>
                        This Month
                      </h3>
                      <div className="stat-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="stat-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '28px', fontWeight: 700 }}>{quickStats.thisMonth.transactions}</div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>Transactions</div>
                          </div>
                        </div>
                        <div className="stat-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                          <div>
                            <div style={{ fontSize: '24px', fontWeight: 700 }}>{PesoFormat(quickStats.thisMonth.amount)}</div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>Total Amount</div>
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

        <IonCard className="report-controls-card" style={{ marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <IonCardHeader style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
            <IonCardTitle style={{ fontSize: '16px', fontWeight: 600, color: 'black', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '4px',
                height: '24px',
                background: 'var(--ion-color-primary)',
                borderRadius: '2px'
              }} />
              Detailed Report Configuration
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent style={{ padding: '20px' }}>
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
                  <div style={{ paddingTop: '26px' }}>
                    <IonButton
                      expand="block"
                      onClick={() => reportQuery.refetch()}
                      disabled={isLoading}
                      color="primary"
                      style={{
                        height: '56px',
                        fontWeight: 600,
                        fontSize: '15px'
                      }}
                    >
                      {isLoading ? (
                        <>
                          <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                          Loading...
                        </>
                      ) : (
                        <>
                          <IonIcon icon={statsChartOutline} slot="start" />
                          Generate Report
                        </>
                      )}
                    </IonButton>
                  </div>
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
            <IonCard style={{ marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <IonCardHeader style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                <IonCardTitle style={{ fontSize: '16px', fontWeight: 600, color: 'black', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '4px',
                    height: '24px',
                    background: 'var(--ion-color-primary)',
                    borderRadius: '2px'
                  }} />
                  Export Options
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent style={{ padding: '20px' }}>
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
              <IonCard style={{ marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <IonCardHeader style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <IonCardTitle style={{ fontSize: '16px', fontWeight: 600, color: 'black', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <div style={{
                        width: '4px',
                        height: '24px',
                        background: 'var(--ion-color-primary)',
                        borderRadius: '2px'
                      }} />
                      {selectedPeriod} Report Summary
                    </IonCardTitle>
                    <IonBadge color="medium" style={{ fontSize: '11px', padding: '6px 12px' }}>
                      {new Date(report.generatedAt).toLocaleString()}
                    </IonBadge>
                  </div>
                </IonCardHeader>
                <IonCardContent style={{ padding: '20px' }}>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="6" sizeMd="4">
                        <div className="summary-item" style={{
                          background: 'var(--ion-color-primary)',
                          borderRadius: '12px',
                          padding: '20px',
                          color: 'white',
                          minHeight: '100px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>Total Transactions</div>
                          <div style={{ fontSize: '32px', fontWeight: 700 }}>{report.report.summary.totalTransactions}</div>
                        </div>
                      </IonCol>
                      <IonCol size="6" sizeMd="4">
                        <div className="summary-item" style={{
                          background: 'var(--ion-color-secondary)',
                          borderRadius: '12px',
                          padding: '20px',
                          color: 'white',
                          minHeight: '100px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>Total Amount</div>
                          <div style={{ fontSize: '28px', fontWeight: 700 }}>{PesoFormat(report.report.summary.totalAmount)}</div>
                        </div>
                      </IonCol>

                      {report.report.summary.averageAmount !== undefined && report.report.summary.averageAmount !== null && (
                        <IonCol size="6" sizeMd="4">
                          <div className="summary-item" style={{
                            background: 'var(--ion-color-primary)',
                            borderRadius: '12px',
                            padding: '20px',
                            color: 'white',
                            minHeight: '100px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>Average Amount</div>
                            <div style={{ fontSize: '28px', fontWeight: 700 }}>{PesoFormat(report.report.summary.averageAmount)}</div>
                          </div>
                        </IonCol>
                      )}
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>
            )}

            {/* Top Users */}
            {report.report?.topUsers && report.report.topUsers.length > 0 && (
              <IonCard style={{ marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <IonCardHeader style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '12px' }}>
                  <IonCardTitle style={{ fontSize: '16px', fontWeight: 600, color: 'black', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '4px',
                      height: '24px',
                      background: 'var(--ion-color-primary)',
                      borderRadius: '2px'
                    }} />
                    Top Users
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent style={{ padding: '20px' }}>
                  <div className="top-users-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {report.report.topUsers.map((user, index: number) => (
                      <div key={user.userId} className="user-item" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        background: index < 3 ? '#f5f5f5' : 'white',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        transition: 'transform 0.2s ease',
                        cursor: 'default'
                      }}>
                        <div className="user-rank" style={{
                          minWidth: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          background: index < 3 ? 'var(--ion-color-primary)' : '#e0e0e0',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '16px'
                        }}>
                          #{index + 1}
                        </div>
                        <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
                          <div className="user-name" style={{
                            fontWeight: 600,
                            fontSize: '15px',
                            color: 'black',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {user.userName || 'N/A'}
                          </div>
                          <div className="user-email" style={{
                            fontSize: '13px',
                            color: '#666',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: '2px'
                          }}>
                            {user.userEmail}
                          </div>
                        </div>
                        <div className="user-stats" style={{
                          display: 'flex',
                          gap: '20px',
                          flexShrink: 0
                        }}>
                          <div className="user-stat" style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'black' }}>{user.transactionCount}</div>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Transactions</div>
                          </div>
                          <div className="user-stat" style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'black' }}>{PesoFormat(user.totalAmount)}</div>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Total Amount</div>
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
  );
}
export default ReportsPage;