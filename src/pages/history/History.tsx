// src/pages/history/History.tsx
import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonBadge,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  RefresherEventDetail,
  InfiniteScrollCustomEvent,
} from '@ionic/react';
import {
  timeOutline,
  cardOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  hourglass,
  locationOutline,
  playOutline,
  stopOutline,
} from 'ionicons/icons';
import { useUser } from '../../hooks/UserHooks';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { SessionWithTable, CreditTransaction } from '../../schema/user.schema';
import './History.css';

type FilterType = 'all' | 'sessions' | 'transactions';

const History: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [displayCount, setDisplayCount] = useState(10);

  const {
    sessions,
    transactions,
    isLoadingSessions,
    isLoadingTransactions,
    refetchSessions,
    refetchTransactions,
  } = useUser();

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await Promise.all([
      refetchSessions(),
      refetchTransactions(),
    ]);
    event.detail.complete();
  };

  const handleInfiniteScroll = async (ev: InfiniteScrollCustomEvent) => {
    setDisplayCount(prev => prev + 10);
    setTimeout(() => ev.target.complete(), 500);
  };

  const formatDuration = (startTime: string, endTime?: string): string => {
    if (!endTime) return 'Ongoing';
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'completed':
        return 'success';
      case 'active':
        return 'warning';
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return checkmarkCircleOutline;
      case 'rejected':
        return closeCircleOutline;
      case 'active':
        return playOutline;
      default:
        return hourglass;
    }
  };

  const getFilteredAndSortedData = () => {
    let combinedData: Array<{
      type: 'session' | 'transaction';
      data: SessionWithTable | CreditTransaction;
      timestamp: number;
    }> = [];

    if (selectedFilter === 'all' || selectedFilter === 'sessions') {
      sessions?.forEach((session) => {
        combinedData.push({
          type: 'session',
          data: session,
          timestamp: new Date(session.startTime).getTime(),
        });
      });
    }

    if (selectedFilter === 'all' || selectedFilter === 'transactions') {
      transactions?.forEach((transaction) => {
        combinedData.push({
          type: 'transaction',
          data: transaction,
          timestamp: new Date(transaction.createdAt).getTime(),
        });
      });
    }

    // Sort by timestamp (newest first)
    combinedData.sort((a, b) => b.timestamp - a.timestamp);
    
    return combinedData.slice(0, displayCount);
  };

  const renderSessionItem = (session: SessionWithTable) => (
    <IonCard key={session.id} className={`history-item session-item ${session.status.toLowerCase()}`}>
      <IonCardContent>
        <div className="item-content">
          <div className="item-header">
            <div className="item-title">
              <IonIcon icon={timeOutline} className="item-icon" />
              <h3>Table {session.table.tableNumber}</h3>
            </div>
            <IonBadge color={getStatusColor(session.status)} className="item-badge">
              <IonIcon icon={getStatusIcon(session.status)} />
              {session.status}
            </IonBadge>
          </div>
          
          <div className="item-details">
            <div className="item-detail">
              <span className="detail-label">
                <IonIcon icon={locationOutline} />
                Location
              </span>
              <span className="detail-value">{session.table.location}</span>
            </div>
            
            <div className="item-detail">
              <span className="detail-label">Duration</span>
              <span className="detail-value duration">
                {formatDuration(session.startTime, session.endTime!)}
              </span>
            </div>
            
            <div className="item-detail">
              <span className="detail-label">Credits Used</span>
              <span className="detail-value credits">{session.creditsUsed}</span>
            </div>
            
            <div className="item-detail">
              <span className="detail-label">Rate</span>
              <span className="detail-value">{session.table.hourlyRate} credits/hour</span>
            </div>
          </div>
          
          <div className="item-timestamp">
            Started: {new Date(session.startTime).toLocaleString()}
            {session.endTime && (
              <>
                <br />
                Ended: {new Date(session.endTime).toLocaleString()}
              </>
            )}
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );

  const renderTransactionItem = (transaction: CreditTransaction) => (
    <IonCard key={transaction.id} className={`history-item transaction-item ${transaction.status.toLowerCase()}`}>
      <IonCardContent>
        <div className="item-content">
          <div className="item-header">
            <div className="item-title">
              <IonIcon icon={cardOutline} className="item-icon" />
              <h3>Credit Purchase</h3>
            </div>
            <IonBadge color={getStatusColor(transaction.status)} className="item-badge">
              <IonIcon icon={getStatusIcon(transaction.status)} />
              {transaction.status}
            </IonBadge>
          </div>
          
          <div className="item-details">
            <div className="item-detail">
              <span className="detail-label">Amount</span>
              <span className="detail-value credits">{transaction.amount} credits</span>
            </div>
            
            <div className="item-detail">
              <span className="detail-label">Cost</span>
              <span className="detail-value cost">${transaction.cost.toFixed(2)}</span>
            </div>
            
            <div className="item-detail">
              <span className="detail-label">Payment Method</span>
              <span className="detail-value">
                {transaction.paymentMethod.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            {transaction.approvedAt && (
              <div className="item-detail">
                <span className="detail-label">
                  {transaction.status === 'Approved' ? 'Approved' : 'Processed'}
                </span>
                <span className="detail-value">
                  {new Date(transaction.approvedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          
          <div className="item-timestamp">
            Submitted: {new Date(transaction.createdAt).toLocaleString()}
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );

  const isLoading = isLoadingSessions || isLoadingTransactions;
  const filteredData = getFilteredAndSortedData();

  if (isLoading && !sessions && !transactions) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>History</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <LoadingSpinner message="Loading history..." />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>History</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen className="history-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="history-container">
          {/* Filter Tabs */}
          <div className="filter-tabs">
            <IonSegment
              value={selectedFilter}
              onIonChange={(e) => setSelectedFilter(e.detail.value as FilterType)}
            >
              <IonSegmentButton value="all">
                <IonLabel>All</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="sessions">
                <IonLabel>Sessions</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="transactions">
                <IonLabel>Transactions</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          {/* History Content */}
          {filteredData.length === 0 ? (
            <div className="empty-history">
              <IonIcon 
                icon={selectedFilter === 'sessions' ? timeOutline : 
                      selectedFilter === 'transactions' ? cardOutline : 
                      timeOutline} 
                className="empty-icon" 
              />
              <h3>No {selectedFilter === 'all' ? 'activity' : selectedFilter} yet</h3>
              <p>
                {selectedFilter === 'sessions' && 'Your study sessions will appear here once you start using tables.'}
                {selectedFilter === 'transactions' && 'Your credit purchase history will be shown here.'}
                {selectedFilter === 'all' && 'Your activity history will appear here as you use the app.'}
              </p>
            </div>
          ) : (
            <div className="history-section">
              <div className="history-list">
                {filteredData.map((item, index) => (
                  item.type === 'session' 
                    ? renderSessionItem(item.data as SessionWithTable)
                    : renderTransactionItem(item.data as CreditTransaction)
                ))}
              </div>
              
              {/* Show loading indicator if there's more data to load */}
              {displayCount < (sessions?.length || 0) + (transactions?.length || 0) && (
                <div className="loading-more">
                  <LoadingSpinner size="small" message="Loading more..." />
                </div>
              )}
            </div>
          )}

          <IonInfiniteScroll
            onIonInfinite={handleInfiniteScroll}
            threshold="100px"
            disabled={displayCount >= (sessions?.length || 0) + (transactions?.length || 0)}
          >
            <IonInfiniteScrollContent
              loadingText="Loading more history..."
              loadingSpinner="bubbles"
            />
          </IonInfiniteScroll>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default History;