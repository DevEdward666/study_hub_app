import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { useState, useCallback } from 'react';

export const useQRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const checkPermission = useCallback(async () => {
    try {
      const status = await BarcodeScanner.checkPermission({ force: true });
      setHasPermission(status.granted!);
      return status.granted;
    } catch (error) {
      console.error('Error checking camera permission:', error);
      setHasPermission(false);
      return false;
    }
  }, []);

  const startScan = useCallback(async (): Promise<string | null> => {
    try {
      const permission = await checkPermission();
      if (!permission) {
        throw new Error('Camera permission not granted');
      }

      setIsScanning(true);
      
      // Make background transparent
      document.body.classList.add('scanner-active');
      
      const result = await BarcodeScanner.startScan();
      
      if (result.hasContent) {
        return result.content;
      }
      
      return null;
    } catch (error) {
      console.error('Error scanning QR code:', error);
      throw error;
    } finally {
      setIsScanning(false);
      document.body.classList.remove('scanner-active');
      await BarcodeScanner.stopScan();
    }
  }, [checkPermission]);

  const stopScan = useCallback(async () => {
    try {
      await BarcodeScanner.stopScan();
      setIsScanning(false);
      document.body.classList.remove('scanner-active');
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  }, []);

  return {
    isScanning,
    hasPermission,
    checkPermission,
    startScan,
    stopScan,
  };
};
