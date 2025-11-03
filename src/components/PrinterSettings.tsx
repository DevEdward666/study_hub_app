import React from 'react';
import { useThermalPrinter } from '@/hooks/useThermalPrinter';

interface PrinterSettingsProps {
  onPrintTest?: () => void;
}

export function PrinterSettings({ onPrintTest }: PrinterSettingsProps) {
  const {
    isConnected,
    isConnecting,
    connectionType,
    deviceName,
    bluetoothSupported,
    usbSupported,
    connect,
    disconnect,
    printTest,
    error,
    clearError,
  } = useThermalPrinter();

  const handleConnect = async (type?: 'bluetooth' | 'usb') => {
    try {
      clearError();
      await connect(type);
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      clearError();
      await disconnect();
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  const handlePrintTest = async () => {
    try {
      clearError();
      await printTest();
      onPrintTest?.();
    } catch (err) {
      console.error('Print test failed:', err);
    }
  };

  return (
    <div className="printer-settings-card">
      <div className="printer-settings-header">
        <h3 className="printer-settings-title">🖨️ Thermal Printer</h3>
        <p className="printer-settings-description">
          Connect directly to your thermal printer via Bluetooth or USB
        </p>
      </div>
      
      <div className="printer-settings-content">
        {/* Connection Status */}
        <div className={`printer-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <div className="printer-status-icon">
            {isConnected ? '✅' : '⭕'}
          </div>
          <div className="printer-status-info">
            <p className="printer-status-text">
              {isConnected ? 'Connected' : 'Not Connected'}
            </p>
            {isConnected && (
              <p className="printer-status-details">
                {deviceName} ({connectionType?.toUpperCase()})
              </p>
            )}
            {!isConnected && (
              <p className="printer-status-details">
                Connect a printer to enable printing
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="printer-error">
            ⚠️ {error}
          </div>
        )}

        {/* Browser Support Info */}
        {!bluetoothSupported && !usbSupported && (
          <div className="printer-warning">
            ⚠️ Your browser doesn't support Web Bluetooth or Web Serial API.
            <br />
            Please use Chrome, Edge, or Opera browser.
          </div>
        )}

        {/* Connection Buttons */}
        <div className="printer-buttons">
          {!isConnected ? (
            <>
              <div className="printer-button-grid">
                {bluetoothSupported && (
                  <button
                    onClick={() => handleConnect('bluetooth')}
                    disabled={isConnecting}
                    className="printer-button"
                  >
                    {isConnecting ? '⏳' : '📡'} Bluetooth
                  </button>
                )}

                {usbSupported && (
                  <button
                    onClick={() => handleConnect('usb')}
                    disabled={isConnecting}
                    className="printer-button"
                  >
                    {isConnecting ? '⏳' : '🔌'} USB
                  </button>
                )}
              </div>

              {bluetoothSupported && usbSupported && (
                <button
                  onClick={() => handleConnect()}
                  disabled={isConnecting}
                  className="printer-button printer-button-primary"
                >
                  {isConnecting ? '⏳ Connecting...' : '🖨️ Auto-Connect'}
                </button>
              )}
            </>
          ) : (
            <div className="printer-button-grid">
              <button
                onClick={handlePrintTest}
                className="printer-button"
              >
                🖨️ Print Test
              </button>
              <button
                onClick={handleDisconnect}
                className="printer-button printer-button-danger"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="printer-instructions">
          <p className="printer-instructions-title">How to connect:</p>
          <ol className="printer-instructions-list">
            <li>Make sure your printer is powered on</li>
            <li>For Bluetooth: Pair the printer in your device settings first</li>
            <li>For USB: Connect the printer with a USB cable</li>
            <li>Click "Connect" and select your printer</li>
          </ol>
        </div>

        {/* Supported Printers */}
        <div className="printer-info">
          <p className="printer-info-title">Supported printers:</p>
          <p className="printer-info-text">
            ESC/POS thermal printers (RPP02N, Epson TM series, and compatible models)
          </p>
        </div>
      </div>

      <style>{`
        .printer-settings-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          overflow: hidden;
        }

        .printer-settings-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .printer-settings-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .printer-settings-description {
          color: #64748b;
          font-size: 0.875rem;
          margin: 0;
        }

        .printer-settings-content {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .printer-status {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 6px;
          background: #f8fafc;
        }

        .printer-status.connected {
          background: #f0fdf4;
        }

        .printer-status-icon {
          font-size: 1.5rem;
        }

        .printer-status-info {
          flex: 1;
        }

        .printer-status-text {
          font-weight: 500;
          margin: 0 0 0.25rem 0;
        }

        .printer-status-details {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }

        .printer-error {
          padding: 0.75rem 1rem;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .printer-warning {
          padding: 0.75rem 1rem;
          background: #fef3c7;
          color: #92400e;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .printer-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .printer-button-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .printer-button {
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .printer-button:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .printer-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .printer-button-primary {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .printer-button-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .printer-button-danger {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        .printer-button-danger:hover:not(:disabled) {
          background: #dc2626;
        }

        .printer-instructions {
          font-size: 0.875rem;
          color: #64748b;
        }

        .printer-instructions-title {
          font-weight: 500;
          margin: 0 0 0.5rem 0;
        }

        .printer-instructions-list {
          margin: 0;
          padding-left: 1.5rem;
        }

        .printer-instructions-list li {
          margin: 0.25rem 0;
        }

        .printer-info {
          font-size: 0.875rem;
          color: #64748b;
        }

        .printer-info-title {
          font-weight: 500;
          margin: 0 0 0.25rem 0;
        }

        .printer-info-text {
          margin: 0;
        }
      `}</style>
    </div>
  );
}

