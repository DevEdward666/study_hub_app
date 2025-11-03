/**
 * Browser-Based Thermal Printer Service
 * 
 * Connects directly to thermal printers via:
 * - Web Bluetooth API (for Bluetooth printers)
 * - Web Serial API (for USB printers)
 * 
 * No backend or LocalPrintServer needed!
 * Works from any modern browser on any device.
 */

// Type declarations for Web APIs (in case not in lib)
declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options: any): Promise<any>;
    };
    serial: {
      requestPort(options?: any): Promise<any>;
    };
  }
}

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';

const Commands = {
  // Initialize printer
  INIT: `${ESC}@`,
  
  // Text alignment
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  
  // Text style
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  DOUBLE_WIDTH: `${ESC}!\x20`,
  DOUBLE_HEIGHT: `${ESC}!\x10`,
  NORMAL_SIZE: `${ESC}!\x00`,
  
  // Line feed
  LF: '\x0A',
  
  // Paper cut
  CUT_PAPER: `${GS}V\x41\x00`,
  
  // Feed lines
  FEED_3: `${ESC}d\x03`,
  
  // QR Code commands
  QR_MODEL: `${GS}(k\x04\x00\x31\x41\x32\x00`, // Model 2
  QR_SIZE: (size: number) => `${GS}(k\x03\x00\x31\x43${String.fromCharCode(size)}`, // Size 1-16
  QR_ERROR_CORRECTION: (level: number) => `${GS}(k\x03\x00\x31\x45${String.fromCharCode(48 + level)}`, // 0-3
  QR_STORE: (data: string) => {
    const len = data.length + 3;
    const pL = len % 256;
    const pH = Math.floor(len / 256);
    return `${GS}(k${String.fromCharCode(pL)}${String.fromCharCode(pH)}\x31\x50\x30${data}`;
  },
  QR_PRINT: `${GS}(k\x03\x00\x31\x51\x30`, // Print stored QR code
};

interface PrinterInfo {
  id: string;
  name: string;
  type: 'bluetooth' | 'usb';
}

interface ReceiptData {
  storeName: string;
  address?: string;
  sessionId: string;
  customerName: string;
  tableNumber: string;
  startTime: string;
  endTime: string;
  hours: number;
  rate: number;
  totalAmount: number;
  paymentMethod?: string;
  wifiPassword?: string;
  qrCodeData?: string; // For QR code if needed
  package?: string;
}

class BrowserThermalPrinter {
  private device: any | null = null;
  private writer: WritableStreamDefaultWriter | null = null;
  private characteristic: any | null = null;
  private connectionType: 'bluetooth' | 'usb' | null = null;

  /**
   * Check if Web Bluetooth is supported
   */
  isBluetoothSupported(): boolean {
    return 'bluetooth' in navigator && typeof (navigator as any).bluetooth !== 'undefined';
  }

  /**
   * Check if Web Serial is supported (for USB)
   */
  isSerialSupported(): boolean {
    return 'serial' in navigator && typeof (navigator as any).serial !== 'undefined';
  }

  /**
   * Connect to Bluetooth printer
   */
  async connectBluetooth(): Promise<boolean> {
    try {
      if (!this.isBluetoothSupported()) {
        throw new Error('Web Bluetooth is not supported in this browser');
      }

      console.log('🔵 Requesting Bluetooth printer...');
      
      // Request Bluetooth device
      this.device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Common printer service
          { namePrefix: 'RPP' }, // RPP02N
          { namePrefix: 'Printer' },
        ],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Serial service
        ]
      });

      console.log(`✅ Selected: ${this.device.name}`);

      // Connect to GATT server
      const server = await this.device.gatt!.connect();
      console.log('✅ Connected to GATT server');

      // Get printer service
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      
      // Get write characteristic
      this.characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
      
      this.connectionType = 'bluetooth';
      console.log('✅ Bluetooth printer connected!');
      
      return true;
    } catch (error) {
      console.error('❌ Bluetooth connection failed:', error);
      throw error;
    }
  }

  /**
   * Connect to USB printer via Web Serial API
   */
  async connectUSB(): Promise<boolean> {
    try {
      if (!this.isSerialSupported()) {
        throw new Error('Web Serial API is not supported in this browser');
      }

      console.log('🔌 Requesting USB printer...');

      // Request serial port
      const port = await (navigator as any).serial.requestPort({
        filters: [
          { usbVendorId: 0x0416 }, // Common thermal printer vendor
          { usbVendorId: 0x04b8 }, // Epson
        ]
      });

      console.log('✅ USB port selected');

      // Open port
      await port.open({ baudRate: 9600 });
      console.log('✅ USB port opened');

      this.device = port;
      this.writer = port.writable.getWriter();
      this.connectionType = 'usb';
      
      console.log('✅ USB printer connected!');
      
      return true;
    } catch (error) {
      console.error('❌ USB connection failed:', error);
      throw error;
    }
  }

  /**
   * Auto-detect and connect to available printer
   */
  async connect(): Promise<boolean> {
    // Try Bluetooth first (more common for mobile)
    if (this.isBluetoothSupported()) {
      try {
        return await this.connectBluetooth();
      } catch (error) {
        console.log('Bluetooth failed, trying USB...');
      }
    }

    // Fallback to USB
    if (this.isSerialSupported()) {
      return await this.connectUSB();
    }

    throw new Error('No supported printer connection method available');
  }

  /**
   * Disconnect from printer
   */
  async disconnect(): Promise<void> {
    try {
      if (this.writer) {
        await this.writer.close();
        this.writer = null;
      }

      if (this.device) {
        if (this.connectionType === 'bluetooth' && 'gatt' in this.device) {
          await this.device.gatt?.disconnect();
        } else if (this.connectionType === 'usb' && 'close' in this.device) {
          await this.device.close();
        }
        this.device = null;
      }

      this.characteristic = null;
      this.connectionType = null;
      
      console.log('✅ Disconnected from printer');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
    }
  }

  /**
   * Write data to printer
   */
  private async write(data: string | Uint8Array): Promise<void> {
    const bytes = typeof data === 'string' 
      ? new TextEncoder().encode(data)
      : data;

    if (this.connectionType === 'bluetooth' && this.characteristic) {
      // Bluetooth: Write in chunks (max 512 bytes)
      const chunkSize = 512;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
        await this.characteristic.writeValue(chunk);
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay between chunks
      }
    } else if (this.connectionType === 'usb' && this.writer) {
      // USB: Write all at once
      await this.writer.write(bytes);
    } else {
      throw new Error('Printer not connected');
    }
  }

  /**
   * Generate WiFi QR code data string
   * Format: WIFI:T:WPA;S:<SSID>;P:<PASSWORD>;;
   */
  private generateWiFiQRData(ssid: string, password: string, securityType: 'WPA' | 'WEP' | 'nopass' = 'WPA'): string {
    return `WIFI:T:${securityType};S:${ssid};P:${password};;`;
  }

  /**
   * Print QR code
   */
  private async printQRCode(data: string, size: number = 6): Promise<void> {
    try {
      // Set QR code model
      await this.write(Commands.QR_MODEL);
      
      // Set QR code size (1-16, where 6 is a good medium size)
      await this.write(Commands.QR_SIZE(size));
      
      // Set error correction level (0=L, 1=M, 2=Q, 3=H)
      await this.write(Commands.QR_ERROR_CORRECTION(1)); // Medium error correction
      
      // Store QR code data
      await this.write(Commands.QR_STORE(data));
      
      // Small delay to ensure data is stored
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Print the QR code
      await this.write(Commands.QR_PRINT);
      
      console.log('✅ QR code printed');
    } catch (error) {
      console.error('❌ QR code print failed:', error);
      // Don't throw - continue with receipt even if QR fails
    }
  }

  /**
   * Generate and print receipt
   */
  async printReceipt(receipt: ReceiptData): Promise<boolean> {
    try {
      console.log('🖨️ Generating receipt...');

      // Initialize printer
      await this.write(Commands.INIT);

      // Header
      await this.write(Commands.ALIGN_CENTER);
      await this.write(Commands.NORMAL_SIZE);
      await this.write(Commands.BOLD_ON);
      await this.write('Sunny Side Up');
      await this.write(Commands.LF);
      await this.write('Work + Study');
      await this.write(Commands.LF);
      await this.write(Commands.NORMAL_SIZE);
      await this.write(Commands.BOLD_OFF);

      if (receipt.address) {
        await this.write(receipt.address);
        await this.write(Commands.LF);
      }

      await this.write('================================');
      await this.write(Commands.LF);
      await this.write(Commands.ALIGN_LEFT);

      // Session details

      await this.write(Commands.ALIGN_LEFT);
      await this.write(Commands.BOLD_OFF);
      await this.write(Commands.LF);
      await this.write(`Session: ${receipt.sessionId.substring(0, 8)}`);
      await this.write(Commands.LF);
      await this.write(`Customer: ${receipt.customerName}`);
      await this.write(Commands.LF);
      await this.write(`Table: ${receipt.tableNumber}`);
      await this.write(Commands.LF);
      await this.write(Commands.LF);

      // Time details
      await this.write(`Start: ${new Date(receipt.startTime).toLocaleString()}`);
      await this.write(Commands.LF);
      await this.write(`End: ${new Date(receipt.endTime).toLocaleString()}`);
      await this.write(Commands.LF);
      await this.write(Commands.BOLD_ON);
      await this.write(`Package: ${receipt.package || "N/A"}`);
      await this.write(Commands.BOLD_OFF);
      await this.write(Commands.LF);
      await this.write(Commands.LF);

      // Amount
      await this.write('--------------------------------');
      await this.write(Commands.LF);

      await this.write(Commands.ALIGN_CENTER);
      await this.write(Commands.NORMAL_SIZE);
      await this.write(Commands.BOLD_ON);
      await this.write(`TOTAL: PHP ${receipt.totalAmount.toFixed(2)}`);
      await this.write(Commands.NORMAL_SIZE);
      await this.write(Commands.BOLD_OFF);
      await this.write(Commands.LF);

      if (receipt.paymentMethod) {
        await this.write(`Payment: ${receipt.paymentMethod}`);
        await this.write(Commands.LF);
      }

      // WiFi password with QR code
      if (receipt.wifiPassword) {
        await this.write(Commands.LF);
        await this.write('================================');
        await this.write(Commands.LF);
        await this.write(Commands.ALIGN_CENTER);
        await this.write(Commands.BOLD_ON);
        await this.write('WiFi Access');
        await this.write(Commands.LF);
        await this.write(Commands.ALIGN_CENTER);
        await this.write(Commands.BOLD_ON);
        await this.write(`Password: ${receipt.wifiPassword}`);
        await this.write(Commands.LF);
        await this.write(Commands.LF);

        // Print WiFi QR Code
        await this.write(Commands.ALIGN_CENTER);
        await this.write('Scan to connect:');
        await this.write(Commands.LF);
        
        // Generate and print WiFi QR code
        const wifiQRData = this.generateWiFiQRData(
          'Sunny Side Up Work + Study',
          receipt.wifiPassword,
          'WPA'
        );
        await this.printQRCode(wifiQRData, 6); // Size 6 for good readability
        
        await this.write(Commands.LF);
      }

      // Footer
      await this.write(Commands.ALIGN_CENTER);
      await this.write(Commands.LF);
      await this.write('================================');
      await this.write(Commands.LF);
      await this.write('Thank you for studying with us!');
      await this.write(Commands.LF);
      await this.write(new Date().toLocaleString());
      await this.write(Commands.LF);

      // Feed and cut
      await this.write(Commands.CUT_PAPER);

      console.log('✅ Receipt printed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Print failed:', error);
      throw error;
    }
  }

  /**
   * Print test receipt
   */
  async printTest(): Promise<boolean> {
    const testReceipt: ReceiptData = {
      storeName: 'STUDY HUB',
      address: 'Test Location',
      sessionId: 'TEST-' + Date.now(),
      customerName: 'Test User',
      tableNumber: 'T-01',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      endTime: new Date().toISOString(),
      hours: 2,
      rate: 50,
      totalAmount: 100,
      paymentMethod: 'Cash',
      wifiPassword: 'test1234',
    };

    return this.printReceipt(testReceipt);
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    if (this.connectionType === 'bluetooth') {
      return this.device !== null && this.device.gatt?.connected === true;
    } else if (this.connectionType === 'usb') {
      return this.device !== null && this.writer !== null;
    }
    return false;
  }

  /**
   * Get connection info
   */
  getConnectionInfo(): { connected: boolean; type: string | null; deviceName?: string } {
    return {
      connected: this.isConnected(),
      type: this.connectionType,
      deviceName: this.connectionType === 'bluetooth' ? this.device?.name : 'USB Printer',
    };
  }
}

// Singleton instance
export const thermalPrinter = new BrowserThermalPrinter();

// Export types
export type { ReceiptData, PrinterInfo };

