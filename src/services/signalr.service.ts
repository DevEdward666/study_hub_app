import * as signalR from "@microsoft/signalr";

export interface SessionEndedNotification {
  id: string;
  sessionId: string;
  tableId: string;
  tableNumber: string;
  userName: string;
  message: string;
  duration: number;
  amount: number;
  createdAt: string;
}

export class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private onSessionEndedCallback: ((notification: SessionEndedNotification) => void) | null = null;
  private isStarting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private visibilityChangeHandler: (() => void) | null = null;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;

  constructor(private baseUrl: string) {
    // Don't create connection in constructor - create it lazily in start()
    this.setupNetworkListeners();
  }

  private setupNetworkListeners() {
    // Handle network online/offline events (important for mobile)
    this.onlineHandler = () => {
      console.log("Network online - attempting to reconnect SignalR");
      setTimeout(() => {
        if (this.connection?.state === signalR.HubConnectionState.Disconnected) {
          this.start();
        }
      }, 1000);
    };

    this.offlineHandler = () => {
      console.log("Network offline - SignalR will reconnect when online");
    };

    // Handle page visibility changes (important for mobile Chrome background tabs)
    this.visibilityChangeHandler = () => {
      if (document.visibilityState === 'visible') {
        console.log("Page became visible - checking SignalR connection");
        setTimeout(() => {
          if (this.connection?.state === signalR.HubConnectionState.Disconnected) {
            console.log("Reconnecting SignalR after page became visible");
            this.start();
          }
        }, 500);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onlineHandler);
      window.addEventListener('offline', this.offlineHandler);
      document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    }
  }

  private removeNetworkListeners() {
    if (typeof window !== 'undefined' && this.onlineHandler && this.offlineHandler && this.visibilityChangeHandler) {
      window.removeEventListener('online', this.onlineHandler);
      window.removeEventListener('offline', this.offlineHandler);
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
  }

  private createConnection() {
    if (this.connection) {
      return this.connection;
    }

    console.log("Creating SignalR connection to:", `${this.baseUrl}/hubs/notifications`);

    // Detect if we're on mobile (important for transport selection)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    console.log(`Device detection: isMobile=${isMobile}, isAndroid=${isAndroid}`);

    // For Android, prefer LongPolling over WebSockets due to Chrome issues
    // For other platforms, prefer WebSockets
    const transportOrder = isAndroid 
      ? signalR.HttpTransportType.LongPolling | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.WebSockets
      : signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/hubs/notifications`, {
        skipNegotiation: false,
        transport: transportOrder,
        withCredentials: false,
        headers: {
          // Add any auth headers if needed
        },
        // Timeout settings optimized for mobile
        timeout: 30000, // 30 seconds (default is 15s, mobile needs more time)
        // Add transport-specific options for better mobile support
        ...(isAndroid && {
          // For Android, use longer polling intervals
          longPollingOptions: {
            pollInterval: 2000, // Poll every 2 seconds
          }
        })
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Custom backoff strategy for mobile
          // Start with short delays, increase exponentially
          if (retryContext.previousRetryCount === 0) return 0;
          if (retryContext.previousRetryCount === 1) return 2000;
          if (retryContext.previousRetryCount === 2) return 5000;
          if (retryContext.previousRetryCount === 3) return 10000;
          if (retryContext.previousRetryCount < 10) return 15000;
          // After 10 attempts, try every 30 seconds
          return 30000;
        }
      })
      .configureLogging(signalR.LogLevel.Debug)
      .build();

    this.setupEventHandlers();
    return this.connection;
  }

  private setupEventHandlers() {
    if (!this.connection) return;

    this.connection.on("SessionEnded", (notification: SessionEndedNotification) => {
      console.log("Session ended notification received:", notification);
      if (this.onSessionEndedCallback) {
        this.onSessionEndedCallback(notification);
      }
    });

    this.connection.onreconnecting((error?: Error) => {
      this.reconnectAttempts++;
      console.warn(`SignalR reconnecting (attempt ${this.reconnectAttempts})...`, error);
    });

    this.connection.onreconnected((connectionId?: string) => {
      console.log("✅ SignalR reconnected:", connectionId);
      this.reconnectAttempts = 0; // Reset counter on successful reconnection
      // Rejoin admins group after reconnection
      this.joinAdminsGroup();
    });

    this.connection.onclose((error?: Error) => {
      console.error("SignalR connection closed:", error);
      this.isStarting = false; // Reset starting flag on close
      
      // On mobile, try to reconnect after a short delay if not intentionally stopped
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`Will attempt to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      }
    });
  }

  async start() {
    // Check if we're online (important for mobile)
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log("⚠️ Device is offline - will connect when online");
      return;
    }

    // Prevent concurrent start attempts
    if (this.isStarting) {
      console.log("SignalR start already in progress, skipping...");
      return;
    }

    // Create connection if it doesn't exist
    const connection = this.createConnection();

    // Check current state
    const currentState = connection.state;
    
    console.log("SignalR current state:", currentState);
    
    if (currentState === signalR.HubConnectionState.Connected) {
      console.log("SignalR already connected");
      this.reconnectAttempts = 0; // Reset on successful connection
      return;
    }

    if (currentState === signalR.HubConnectionState.Connecting) {
      console.log("SignalR already connecting");
      return;
    }

    if (currentState === signalR.HubConnectionState.Reconnecting) {
      console.log("SignalR is reconnecting");
      return;
    }

    // Only start if disconnected
    if (currentState !== signalR.HubConnectionState.Disconnected) {
      console.warn(`SignalR not in disconnected state: ${currentState}, attempting to stop first...`);
      try {
        await connection.stop();
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error("Error stopping connection before restart:", err);
      }
    }

    this.isStarting = true;

    try {
      console.log("Starting SignalR connection...");
      await connection.start();
      console.log("✅ SignalR connected successfully");
      console.log("Transport used:", (connection as any).connection?.transport?.name || 'unknown');
      this.isStarting = false;
      this.reconnectAttempts = 0; // Reset counter on successful connection
      await this.joinAdminsGroup();
    } catch (err: any) {
      console.error("❌ Error starting SignalR connection:", err);
      console.error("Error details:", {
        message: err?.message,
        stack: err?.stack,
        statusCode: err?.statusCode,
        url: `${this.baseUrl}/hubs/notifications`,
        isOnline: navigator.onLine,
        userAgent: navigator.userAgent
      });
      this.isStarting = false;
      
      // Retry logic with exponential backoff
      this.reconnectAttempts++;
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
        console.log(`Retrying SignalR connection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(() => {
          if (connection?.state === signalR.HubConnectionState.Disconnected && navigator.onLine) {
            this.start();
          }
        }, delay);
      } else {
        console.error("Max reconnection attempts reached. Please refresh the page or check your connection.");
      }
    }
  }

  async stop() {
    if (!this.connection) return;

    // Don't stop if already disconnected
    if (this.connection.state === signalR.HubConnectionState.Disconnected) {
      console.log("SignalR already disconnected");
      return;
    }

    try {
      await this.connection.stop();
      console.log("SignalR disconnected");
      this.isStarting = false;
      this.reconnectAttempts = 0;
    } catch (err) {
      console.error("Error stopping SignalR connection:", err);
      this.isStarting = false;
    }
  }

  // Add cleanup method for when service is destroyed
  destroy() {
    this.removeNetworkListeners();
    if (this.connection) {
      this.connection.stop();
      this.connection = null;
    }
    this.isStarting = false;
    this.reconnectAttempts = 0;
  }

  private async joinAdminsGroup() {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.invoke("JoinAdmins");
      console.log("Joined admins group");
    } catch (err) {
      console.error("Error joining admins group:", err);
    }
  }

  onSessionEnded(callback: (notification: SessionEndedNotification) => void) {
    this.onSessionEndedCallback = callback;
  }

  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state ?? null;
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  isConnecting(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connecting;
  }
}

// Create singleton instance
const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5212/api";
// Remove /api suffix to get base URL for SignalR hub
const baseUrl = apiBaseUrl.endsWith("/api") 
  ? apiBaseUrl.substring(0, apiBaseUrl.length - 4) 
  : apiBaseUrl.replace("/api/", "");
export const signalRService = new SignalRService(baseUrl);

