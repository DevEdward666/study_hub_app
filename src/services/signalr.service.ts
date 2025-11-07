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

  constructor(private baseUrl: string) {
    // Don't create connection in constructor - create it lazily in start()
  }

  private createConnection() {
    if (this.connection) {
      return this.connection;
    }

    console.log("Creating SignalR connection to:", `${this.baseUrl}/hubs/notifications`);

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}/hubs/notifications`, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
        withCredentials: false,
        headers: {
          // Add any auth headers if needed
        }
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Debug) // Changed to Debug for more details
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
      console.warn("SignalR reconnecting...", error);
    });

    this.connection.onreconnected((connectionId?: string) => {
      console.log("SignalR reconnected:", connectionId);
      // Rejoin admins group after reconnection
      this.joinAdminsGroup();
    });

    this.connection.onclose((error?: Error) => {
      console.error("SignalR connection closed:", error);
      this.isStarting = false; // Reset starting flag on close
    });
  }

  async start() {
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
      this.isStarting = false;
      await this.joinAdminsGroup();
    } catch (err: any) {
      console.error("❌ Error starting SignalR connection:", err);
      console.error("Error details:", {
        message: err?.message,
        stack: err?.stack,
        statusCode: err?.statusCode,
        url: `${this.baseUrl}/hubs/notifications`
      });
      this.isStarting = false;
      
      // Retry after 5 seconds only if still disconnected
      setTimeout(() => {
        if (connection?.state === signalR.HubConnectionState.Disconnected) {
          console.log("Retrying SignalR connection...");
          this.start();
        }
      }, 5000);
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
    } catch (err) {
      console.error("Error stopping SignalR connection:", err);
      this.isStarting = false;
    }
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

