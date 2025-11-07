import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { signalRService, SessionEndedNotification } from '@/services/signalr.service';
import { useToastManager } from '@/components/GlobalToast/GlobalToast';
import { useAdminStatus } from '@/hooks/AdminHooks';

interface NotificationContextType {
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  isConnected: false,
});

export const useNotificationContext = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { showToast } = useToastManager();
  const { isAdmin } = useAdminStatus();
  const [isConnected, setIsConnected] = React.useState(false);

  useEffect(() => {
    // Only connect to SignalR if user is admin
    if (!isAdmin) {
      return;
    }

    // Setup SignalR connection
    const setupSignalR = async () => {
      try {
        // Set up session ended handler
        signalRService.onSessionEnded((notification: SessionEndedNotification) => {
          console.log('Session ended notification:', notification);
          
          // Format the message
          const message = `Table ${notification.tableNumber} session ended for ${notification.userName}. Duration: ${notification.duration.toFixed(2)}hrs, Amount: ₱${notification.amount.toFixed(2)}`;
          
          // Show toast with sound
          showToast(message, 'warning', 10000, true);
        });

        // Start the connection
        await signalRService.start();
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to setup SignalR:', error);
        setIsConnected(false);
      }
    };

    setupSignalR();

    // Cleanup on unmount
    return () => {
      signalRService.stop();
      setIsConnected(false);
    };
  }, [isAdmin, showToast]);

  return (
    <NotificationContext.Provider value={{ isConnected }}>
      {children}
    </NotificationContext.Provider>
  );
};

