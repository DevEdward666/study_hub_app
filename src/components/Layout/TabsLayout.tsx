import React, { useState, useEffect } from "react";
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  useIonViewDidEnter,
  IonButton,
  IonBadge,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import {
  homeOutline,
  qrCodeOutline,
  cardOutline,
  businessOutline,
  timeOutline,
  personOutline,
  tabletPortrait,
  listCircleOutline,
  peopleCircle,
  listOutline,
  listSharp,
  tabletPortraitSharp,
  statsChartOutline,
  menuOutline,
  closeOutline,
  walletOutline,
  chevronForwardOutline,
  chevronBackOutline,
  wifiOutline,
  settingsOutline,
  cashOutline,
  notificationsOutline,
  warningOutline,
} from "ionicons/icons";
import "./TabsLayout.css";
import { useAdminStatus } from "@/hooks/AdminHooks";
import { useNotifications } from "@/hooks/useNotifications";
import { GlobalToast, useToastManager } from "@/components/GlobalToast/GlobalToast";
import { signalRService, SessionEndedNotification } from "@/services/signalr.service";
import { useNotificationContext } from "@/contexts/NotificationContext";

interface TabsLayoutProps {
  children: React.ReactNode;
}

export const TabsLayout: React.FC<TabsLayoutProps> = ({ children }) => {
  const { refetch: refetchAdminStatus, isAdmin, isLoading: isAdminLoading } = useAdminStatus();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const isAdminPath = window.location.pathname.includes("/admin");
  const {
    notifySessionEnd,
    isSupported: isPushSupported,
    permission: pushPermission,
    requestPermission: requestPushPermission
  } = useNotifications();

  // Toast manager
  const { toasts, showToast, dismissToast } = useToastManager();

  // Notification context
  const { addNotification, unreadCount } = useNotificationContext();

  // Modal notification state for session ended
  const [showSessionEndedModal, setShowSessionEndedModal] = useState(false);
  const [sessionEndedData, setSessionEndedData] = useState<SessionEndedNotification | null>(null);

  // Track if SignalR is initialized to prevent multiple starts
  const signalRInitialized = React.useRef(false);
  const audioContextRef = React.useRef<AudioContext | null>(null);

  // Initialize audio context on mount (for browser compatibility)
  useEffect(() => {
    const initAudioContext = async () => {
      try {
        if (!audioContextRef.current) {
          console.log('🎵 Initializing audio context...');
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContextClass();

          // Resume immediately if possible
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }

          console.log('✅ Audio context initialized:', audioContextRef.current.state);
        }
      } catch (error) {
        console.error('❌ Failed to initialize audio context:', error);
      }
    };

    // Initialize on mount
    initAudioContext();

    // Also initialize on user interaction (required by some browsers)
    const handleUserInteraction = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          console.log('🔊 Audio context resumed after user interaction');
        });
      }
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Debug: Log when modal state changes
  useEffect(() => {
    console.log('📊 Session ended modal state changed:', showSessionEndedModal);
    if (sessionEndedData) {
      console.log('📋 Session data:', sessionEndedData);
    }
  }, [showSessionEndedModal, sessionEndedData]);

  // Setup SignalR for admin users
  useEffect(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 SignalR useEffect triggered');
    console.log('isAdmin:', isAdmin);
    console.log('isAdminPath:', isAdminPath);
    console.log('signalRInitialized.current:', signalRInitialized.current);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Only initialize SignalR if user is admin AND on admin path
    if (!isAdminPath) {
      console.log('⚠️ Skipping SignalR setup - not admin or not on admin path');
      // If we leave admin area, stop SignalR
      if (signalRInitialized.current) {
        console.log('Leaving admin area, stopping SignalR...');
        signalRService.stop();
        signalRInitialized.current = false;
      }
      return;
    }

    console.log('✅ Proceeding with SignalR setup...');

    const setupSignalR = async () => {
      try {
        console.log('🔌 Setting up SignalR handler for admin...');

        // ALWAYS set up session ended handler (this is idempotent - safe to call multiple times)
        // This ensures the handler is active even if the component re-renders
        console.log('📝 Registering SessionEnded handler...');
        signalRService.onSessionEnded((notification: SessionEndedNotification) => {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🔔 Session ended notification received:', notification);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          // Add to notification context (which will trigger table refresh)
          console.log('Adding to notification context...');
          addNotification(notification);

          // Store session data for modal
          console.log('📝 Setting session ended data...');
          setSessionEndedData(notification);

          // Play sound immediately when notification is received (pass table number)
          console.log('🔊 Playing session ended sound...');
          playSessionEndedSound(notification.tableNumber);

          // Small delay before showing modal to ensure sound plays first
          setTimeout(() => {
            console.log('🚀 Opening session ended modal...');
            setShowSessionEndedModal(true);
            console.log('Modal state set to true');
          }, 100);
        });
        console.log('✅ SessionEnded handler registered');

        // Only start the connection if not already started
        if (!signalRInitialized.current) {
          console.log('📡 Starting SignalR connection (first time)...');
          await signalRService.start();
          signalRInitialized.current = true;
          console.log('✅ SignalR connection started successfully!');
        } else {
          console.log('ℹ️ SignalR already connected, handler refreshed');
        }

        // Monitor connection health
        console.log('📊 SignalR handler setup complete');
        console.log('📡 Ready to receive session ended notifications');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ Failed to setup SignalR:', error);
        console.error('Error type:', typeof error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('⚠️  SIGNALR CONNECTION FAILED');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Session notifications will NOT work until this is fixed.');
        console.error('Running diagnostics to help identify the issue...');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Auto-run diagnostics when connection fails
        setTimeout(() => {
          runDiagnostics();
        }, 1000);

        signalRInitialized.current = false;
      }
    };

    setupSignalR();

    // Cleanup function
    return () => {
      console.log('♻️ SignalR useEffect cleanup triggered');
      // Don't stop on cleanup unless we're actually unmounting
      // The dependencies will handle re-initialization if needed
    };
  }, [isAdminPath, addNotification, notifySessionEnd]); // Keep dependencies stable

  useIonViewDidEnter(() => {
    if (pushPermission !== "granted") {
      requestPushPermission();
    }
  })

  // Refetch admin status when navigating to admin paths
  useEffect(() => {
    if (isAdminPath) {
      refetchAdminStatus();
    }
  }, [isAdminPath, refetchAdminStatus]);

  const navigateTo = (path: string) => {
    history.push(path);
    setSidebarOpen(false); // Close sidebar after navigation on mobile
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  // Function to play loud doorbell sound for session ended
  const playSessionEndedSound = async (tableNumber: string) => {
    try {
      console.log('🔊 Playing session ended doorbell sound...');

      // Create or use existing audio context
      let audioContext = audioContextRef.current;
      if (!audioContext) {
        console.log('🎵 Creating new audio context...');
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;
      }

      // Resume context if suspended (required by browser autoplay policies)
      if (audioContext.state === 'suspended') {
        console.log('⏸️ Audio context suspended, resuming...');
        await audioContext.resume();
        console.log('▶️ Audio context resumed');
      }

      console.log('🎵 Audio context state:', audioContext.state);

      // Louder doorbell chime pattern
      const notes = [
        { frequency: 523.25, time: 0, duration: 0.3 },      // C5 - Ding
        { frequency: 659.25, time: 0.2, duration: 0.3 },    // E5 - Dong
        { frequency: 783.99, time: 0.4, duration: 0.5 }     // G5 - Ding (longer)
      ];

      notes.forEach(note => {
        const oscillator = audioContext!.createOscillator();
        const gainNode = audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext!.destination);

        oscillator.frequency.value = note.frequency;
        oscillator.type = 'sine';

        const startTime = audioContext!.currentTime + note.time;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.8, startTime + 0.01); // Very loud!
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration);
      });

      // Add reverb echo
      notes.forEach(note => {
        const oscillator = audioContext!.createOscillator();
        const gainNode = audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext!.destination);

        oscillator.frequency.value = note.frequency;
        oscillator.type = 'sine';

        const startTime = audioContext!.currentTime + note.time + 0.05;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration + 0.1);

        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration + 0.1);
      });

      // Speak the table number after sound
      setTimeout(() => {
        speakTableNumber(tableNumber);
      }, 800);

      console.log('✅ Session ended sound played successfully');
    } catch (error) {
      console.error('❌ Error playing session ended sound:', error);

      // Fallback: try to play a simple beep as backup
      try {
        console.log('🔄 Attempting fallback beep...');
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        await audioContext.resume();

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.8, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        console.log('✅ Fallback beep played');
      } catch (fallbackError) {
        console.error('❌ Fallback beep also failed:', fallbackError);
      }
    }
  };

  // Function to speak table number
  const speakTableNumber = (tableNumber: string) => {
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Table ${tableNumber} session has ended`);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Error with speech synthesis:', error);
    }
  };

  const handleCloseSessionModal = () => {
    console.log('❌ Closing session ended modal...');
    setShowSessionEndedModal(false);
    setSessionEndedData(null);
  };

  // Function to run diagnostics (can be called when issues are detected)
  const runDiagnostics = () => {
    console.log('🔧 Running SignalR diagnostics...');

    // Load and run the diagnostic script
    const script = document.createElement('script');
    script.src = '/signalr-diagnostic.js';
    script.onload = () => {
      console.log('✅ Diagnostic script loaded');
      // The script will auto-run
    };
    script.onerror = () => {
      console.error('❌ Failed to load diagnostic script');
      // Run inline diagnostics as fallback
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 QUICK DIAGNOSTICS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      const token = localStorage.getItem('auth_token');
      console.log('Auth token:', token ? 'EXISTS' : 'MISSING');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('Role:', payload.role);
          console.log('Expires:', new Date(payload.exp * 1000).toLocaleString());
          console.log('Expired:', Date.now() > payload.exp * 1000 ? 'YES ❌' : 'NO ✅');
        } catch (e) {
          console.error('Token decode error:', e);
        }
      }
      console.log('Is Admin:', isAdmin);
      console.log('Is Admin Path:', isAdminPath);
      console.log('Online:', navigator.onLine);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    };
    document.head.appendChild(script);
  };

  // Expose diagnostics to window for easy access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).runSignalRDiagnostics = runDiagnostics;
      console.log('💡 SignalR diagnostics available: window.runSignalRDiagnostics()');
    }
  }, [isAdmin, isAdminPath]);

  if (isAdminPath && isAdminLoading) {
    return (
      <div className="admin-loading">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div className="spinner"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-layout ${isAdmin && isAdminPath ? 'admin-layout' : 'user-layout'} ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {isAdmin && isAdminPath && (
        <>
          {/* Mobile Menu Button */}
          <IonButton
            fill="clear"
            className={`mobile-menu-btn ${sidebarOpen ? 'sidebar-open' : ''}`}
            onClick={toggleSidebar}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <IonIcon
              icon={sidebarOpen ? chevronBackOutline : chevronForwardOutline}
              style={{
                transition: 'transform 0.2s ease'
              }}
            />
          </IonButton>

          {/* Sidebar Overlay for mobile */}
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

          <nav className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <div className="sidebar-header">
              <h3>Sunny Side Up Admin</h3>
              <IonButton
                fill="clear"
                className="sidebar-close-btn"
                onClick={() => setSidebarOpen(false)}
                title="Close menu"
              >
                <IonIcon
                  icon={closeOutline}
                  style={{ fontSize: '20px' }}
                />
              </IonButton>
            </div>
            <div className="sidebar-menu">
              <button
                onClick={() => navigateTo('/app/admin/dashboard')}
                className={`sidebar-item ${isActiveRoute('/app/admin/dashboard') ? 'active' : ''}`}
              >
                <IonIcon icon={statsChartOutline} />
                <span>Dashboard</span>
              </button>

              {/* PRIMARY WORKFLOW */}
              <p style={{ fontSize: '11px', margin: '0 0 4px 0', fontWeight: 'bold' }}>MAIN WORKSPACE</p>
              <button
                onClick={() => navigateTo('/app/admin/user-sessions')}
                className={`sidebar-item ${isActiveRoute('/app/admin/user-sessions') ? 'active' : ''}`}
                style={{ color: 'white' }}
              >
                <IonIcon icon={peopleCircle} />
                <span> User & Sessions</span>
              </button>

              {/* SUBSCRIPTION MANAGEMENT */}
              <div style={{ margin: '16px 0 8px 0' }}>
                <p style={{ fontSize: '11px', color: '#666', margin: '0 0 4px 8px', fontWeight: 'bold' }}>SUBSCRIPTION SETUP</p>
              </div>

              <button
                onClick={() => navigateTo('/app/admin/subscription-packages')}
                className={`sidebar-item ${isActiveRoute('/app/admin/subscription-packages') ? 'active' : ''}`}
              >
                <IonIcon icon={cardOutline} />
                <span>Rate Packages</span>
              </button>

              <button
                onClick={() => navigateTo('/app/admin/user-subscriptions')}
                className={`sidebar-item ${isActiveRoute('/app/admin/user-subscriptions') ? 'active' : ''}`}
              >
                <IonIcon icon={walletOutline} />
                <span>Transaction</span>
              </button>

              {/* SYSTEM MANAGEMENT */}
              <div style={{ margin: '16px 0 8px 0' }}>
                <p style={{ fontSize: '11px', color: '#666', margin: '0 0 4px 8px', fontWeight: 'bold' }}>SYSTEM</p>
              </div>

              <button
                onClick={() => navigateTo('/app/admin/tables')}
                className={`sidebar-item ${isActiveRoute('/app/admin/tables') ? 'active' : ''}`}
              >
                <IonIcon icon={tabletPortraitSharp} />
                <span>Table Setup</span>
              </button>

              <button
                onClick={() => navigateTo('/app/admin/transactions')}
                className={`sidebar-item ${isActiveRoute('/app/admin/transactions') ? 'active' : ''}`}
              >
                <IonIcon icon={listOutline} />
                <span>Transaction History</span>
              </button>

              <button
                onClick={() => navigateTo('/app/admin/users')}
                className={`sidebar-item ${isActiveRoute('/app/admin/users') ? 'active' : ''}`}
              >
                <IonIcon icon={peopleCircle} />
                <span>User Accounts</span>
              </button>

              <button
                onClick={() => navigateTo('/app/admin/reports')}
                className={`sidebar-item ${isActiveRoute('/app/admin/reports') ? 'active' : ''}`}
              >
                <IonIcon icon={listCircleOutline} />
                <span>Reports</span>
              </button>

              <button
                onClick={() => navigateTo('/app/admin/notifications')}
                className={`sidebar-item ${isActiveRoute('/app/admin/notifications') ? 'active' : ''}`}
              >
                <IonIcon icon={notificationsOutline} />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <IonBadge color="danger" className="sidebar-badge">
                    {unreadCount}
                  </IonBadge>
                )}
              </button>

              <button
                onClick={() => navigateTo('/app/admin/global-settings')}
                className={`sidebar-item ${isActiveRoute('/app/admin/global-settings') ? 'active' : ''}`}
              >
                <IonIcon icon={settingsOutline} />
                <span>Settings</span>
              </button>

              <button
                onClick={() => navigateTo('/app/admin/profile')}
                className={`sidebar-item ${isActiveRoute('/app/admin/profile') ? 'active' : ''}`}
              >
                <IonIcon icon={personOutline} />
                <span>Profile</span>
              </button>
            </div>
          </nav>
        </>
      )}

      <main className="main-content">
        {(isAdmin && isAdminPath) ? (
          // For admin, use simple router outlet without tabs
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        ) : !isAdminPath ? (
          // For users, use the tab system (only if not on admin path)
          <IonTabs>
            <IonRouterOutlet>{children}</IonRouterOutlet>
            <IonTabBar slot="bottom" className="tabs-bar mobile-only">
              <IonTabButton tab="dashboard" href="/app/dashboard">
                <IonIcon icon={homeOutline} />
                <IonLabel>Dashboard</IonLabel>
              </IonTabButton>

              <IonTabButton tab="scanner" href="/app/scanner">
                <IonIcon icon={qrCodeOutline} />
                <IonLabel>Scanner</IonLabel>
              </IonTabButton>


              <IonTabButton tab="credits" href="/app/credits">
                <IonIcon icon={cardOutline} />
                <IonLabel>Credits</IonLabel>
              </IonTabButton>

              <IonTabButton tab="subscriptions" href="/app/subscriptions">
                <IonIcon icon={walletOutline} />
                <IonLabel>Subscriptions</IonLabel>
              </IonTabButton>

              <IonTabButton tab="premise" href="/app/premise">
                <IonIcon icon={businessOutline} />
                <IonLabel>Premise</IonLabel>
              </IonTabButton>

              <IonTabButton tab="history" href="/app/history">
                <IonIcon icon={timeOutline} />
                <IonLabel>History</IonLabel>
              </IonTabButton>

              <IonTabButton tab="profile" href="/app/profile">
                <IonIcon icon={personOutline} />
                <IonLabel>Profile</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        ) : (
          // If on admin path but not admin, redirect or show error
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <p>Access denied. Admin privileges required.</p>
          </div>
        )}
      </main>

      {/* Global Toast Notifications */}
      <GlobalToast messages={toasts} onDismiss={dismissToast} />

      {/* Session Ended Modal - More Obvious Notification */}
      <IonModal
        isOpen={showSessionEndedModal}
        onDidDismiss={handleCloseSessionModal}
        className="session-ended-modal"
        backdropDismiss={false}
      >
        <IonHeader>
          <IonToolbar color="warning">
            <IonTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonIcon icon={warningOutline} style={{ fontSize: '24px' }} />
              Session Ended Alert
            </IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {sessionEndedData ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              padding: '20px'
            }}>
              <style>{`
                @keyframes pulse {
                  0%, 100% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7);
                  }
                  50% {
                    transform: scale(1.05);
                    box-shadow: 0 0 0 20px rgba(255, 107, 107, 0);
                  }
                }
              `}</style>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FFB74D 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}>
                <IonIcon
                  icon={timeOutline}
                  style={{ fontSize: '64px', color: 'white' }}
                />
              </div>

              <IonCard style={{ width: '100%', margin: 0 }}>
                <IonCardContent>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2 style={{
                      color: 'var(--ion-color-warning)',
                      margin: '0 0 8px 0',
                      fontSize: '28px',
                      fontWeight: 'bold'
                    }}>
                      Table {sessionEndedData.tableNumber}
                    </h2>
                    <p style={{
                      fontSize: '18px',
                      color: '#666',
                      margin: 0
                    }}>
                      Session has ended
                    </p>
                  </div>

                  <div style={{
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #ddd'
                    }}>
                      <span style={{ color: '#666' }}>Customer:</span>
                      <strong style={{ fontSize: '16px' }}>{sessionEndedData.userName}</strong>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid #ddd'
                    }}>
                      <span style={{ color: '#666' }}>Duration:</span>
                      <strong style={{ fontSize: '16px', color: 'var(--ion-color-primary)' }}>
                        {sessionEndedData.duration.toFixed(2)} hours
                      </strong>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ color: '#666' }}>Amount:</span>
                      <strong style={{ fontSize: '18px', color: 'var(--ion-color-success)' }}>
                        ₱{sessionEndedData.amount.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div style={{
                    background: '#FFF3CD',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #FFC107',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      margin: 0,
                      color: '#856404',
                      fontSize: '14px'
                    }}>
                      ⚠️ Please check on the customer and prepare the table for the next session
                    </p>
                  </div>
                </IonCardContent>
              </IonCard>

              <IonButton
                expand="block"
                size="large"
                onClick={handleCloseSessionModal}
                style={{
                  width: '100%',
                  '--background': 'linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-secondary) 100%)',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                Got It - Close Alert
              </IonButton>

              <IonButton
                fill="outline"
                expand="block"
                onClick={() => {
                  handleCloseSessionModal();
                  navigateTo('/app/admin/user-sessions');
                }}
                style={{ width: '100%' }}
              >
                Go to Tables Management
              </IonButton>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: '#666' }}>Loading session data...</p>
            </div>
          )}
        </IonContent>
      </IonModal>
    </div>
  );
};
