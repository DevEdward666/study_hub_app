import { useState, useEffect, useCallback } from 'react';
import { thermalPrinter, type ReceiptData } from '@/services/thermal-printer.service';

interface UseThermalPrinterReturn {
  isConnected: boolean;
  isConnecting: boolean;
  connectionType: 'bluetooth' | 'usb' | null;
  deviceName: string | null;
  bluetoothSupported: boolean;
  usbSupported: boolean;
  connect: (type?: 'bluetooth' | 'usb') => Promise<void>;
  disconnect: () => Promise<void>;
  print: (receipt: ReceiptData) => Promise<void>;
  printTest: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

/**
 * React hook for managing thermal printer connection and printing
 * 
 * Usage:
 * ```tsx
 * const { connect, print, isConnected } = useThermalPrinter();
 * 
 * // Connect to printer
 * await connect(); // Auto-detect
 * // or
 * await connect('bluetooth'); // Specific type
 * 
 * // Print receipt
 * await print(receiptData);
 * ```
 */
export function useThermalPrinter(): UseThermalPrinterReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionType, setConnectionType] = useState<'bluetooth' | 'usb' | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bluetoothSupported = thermalPrinter.isBluetoothSupported();
  const usbSupported = thermalPrinter.isSerialSupported();

  // Check connection status
  useEffect(() => {
    const checkStatus = () => {
      const info = thermalPrinter.getConnectionInfo();
      setIsConnected(info.connected);
      setConnectionType(info.type as 'bluetooth' | 'usb' | null);
      setDeviceName(info.deviceName || null);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(async (type?: 'bluetooth' | 'usb') => {
    try {
      setIsConnecting(true);
      setError(null);

      if (type === 'bluetooth') {
        await thermalPrinter.connectBluetooth();
      } else if (type === 'usb') {
        await thermalPrinter.connectUSB();
      } else {
        await thermalPrinter.connect();
      }

      const info = thermalPrinter.getConnectionInfo();
      setIsConnected(info.connected);
      setConnectionType(info.type as 'bluetooth' | 'usb' | null);
      setDeviceName(info.deviceName || null);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to connect to printer';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setError(null);
      await thermalPrinter.disconnect();
      setIsConnected(false);
      setConnectionType(null);
      setDeviceName(null);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to disconnect';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const print = useCallback(async (receipt: ReceiptData) => {
    try {
      setError(null);

      if (!isConnected) {
        throw new Error('Printer not connected. Please connect first.');
      }

      await thermalPrinter.printReceipt(receipt);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to print';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isConnected]);

  const printTest = useCallback(async () => {
    try {
      setError(null);

      if (!isConnected) {
        throw new Error('Printer not connected. Please connect first.');
      }

      await thermalPrinter.printTest();
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to print test';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isConnected]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isConnected,
    isConnecting,
    connectionType,
    deviceName,
    bluetoothSupported,
    usbSupported,
    connect,
    disconnect,
    print,
    printTest,
    error,
    clearError,
  };
}

