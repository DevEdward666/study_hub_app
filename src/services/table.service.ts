import { apiClient } from './api.client';
import {
  StudyTable,
  SessionWithTable,
  StartSessionRequest,
  EndSessionResponse,
  ChangeTableResponse,
  StudyTableSchema,
  SessionWithTableSchema,
  StartSessionRequestSchema,
  EndSessionResponseSchema,
  ChangeTableResponseSchema
} from '../schema/table.schema';
import { ApiResponseSchema } from '../schema/api.schema';
import { z } from 'zod';
import { thermalPrinter, type ReceiptData } from './thermal-printer.service';

export class TableService {
  // ...existing code...

  /**
   * Print receipt directly from browser to thermal printer
   * Falls back to backend printing if direct printing fails or printer not connected
   */
  async printReceiptDirect(session: SessionWithTable, wifiPassword?: string): Promise<boolean> {
    try {
      // Check if printer is connected
      if (!thermalPrinter.isConnected()) {
        console.log('📡 Printer not connected, falling back to backend printing');
        return this.printReceipt(session.id, wifiPassword);
      }

      console.log('🖨️ Printing directly from browser...');

      // Calculate hours if endTime is available
      const hours = session.startTime && session.endTime
        ? (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60 * 60)
        : 0;

      // Prepare receipt data
      const receiptData: ReceiptData = {
        storeName: 'STUDY HUB',
        sessionId: session.id,
        customerName: session.table?.currentSession?.customerName || 'Customer',
        tableNumber: session.table?.tableNumber || 'N/A',
        startTime: session.startTime || new Date().toISOString(),
        endTime: session.endTime || new Date().toISOString(),
        hours: hours,
        rate: session.table?.hourlyRate || 0,
        totalAmount: session.amount || 0,
        paymentMethod: session.paymentMethod || undefined,
        wifiPassword: wifiPassword,
      };

      // Print directly
      await thermalPrinter.printReceipt(receiptData);
      
      console.log('✅ Receipt printed directly from browser');
      return true;
    } catch (error) {
      console.error('❌ Direct printing failed:', error);
      console.log('📡 Falling back to backend printing');
      
      // Fallback to backend printing
      try {
        return await this.printReceipt(session.id, wifiPassword);
      } catch (backendError) {
        console.error('❌ Backend printing also failed:', backendError);
        throw new Error('Both direct and backend printing failed');
      }
    }
  }
  async getAllTables(): Promise<StudyTable[]> {
    return apiClient.get(
      '/tables',
      ApiResponseSchema(z.array(StudyTableSchema))
    );
  }

  async getTableByQR(qrCode: string): Promise<StudyTable | null> {
    return apiClient.get(
      `/tables/by-qr/${encodeURIComponent(qrCode)}`,
      ApiResponseSchema(StudyTableSchema.nullable())
    );
  }

  async startSession(request: StartSessionRequest): Promise<string> {
    StartSessionRequestSchema.parse(request);
    return apiClient.post(
      '/tables/sessions/start',
      ApiResponseSchema(z.string()),
      request
    );
  }

  async endSession(sessionId: string, autoPrint: boolean = false, wifiPassword?: string): Promise<EndSessionResponse> {
    const response = await apiClient.post(
      '/tables/sessions/end',
      ApiResponseSchema(EndSessionResponseSchema),
      sessionId
    );

    // Auto print receipt if requested
    if (autoPrint && response) {
      try {
        await this.printReceiptFromResponse(response, wifiPassword);
      } catch (error) {
        console.error('Failed to auto-print receipt:', error);
        // Don't throw error, printing failure shouldn't block session end
      }
    }

    return response;
  }

  /**
   * Print receipt using response data from endSession
   */
  async printReceiptFromResponse(sessionData: EndSessionResponse, wifiPassword?: string): Promise<void> {
    // Import thermal printer dynamically to avoid circular dependency
    const { thermalPrinter } = await import('./thermal-printer.service');
    
    if (thermalPrinter.isConnected()) {
      await thermalPrinter.printReceipt({
        storeName: 'Sunny Side Up',
        sessionId: sessionData.sessionId,
        customerName: sessionData.customerName,
        tableNumber: sessionData.tableNumber,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime,
        hours: sessionData.hours,
        rate: sessionData.rate,
        totalAmount: sessionData.amount,
        paymentMethod: sessionData.paymentMethod || undefined,
        wifiPassword: wifiPassword,
      });
    } else {
      // Fallback to backend printing
      await this.printReceipt(sessionData.sessionId, wifiPassword);
    }
  }

  async changeTable(sessionId: string, newTableId: string): Promise<ChangeTableResponse> {
    return apiClient.post(
      '/tables/sessions/change-table',
      ApiResponseSchema(ChangeTableResponseSchema),
      { sessionId, newTableId }
    );
  }

  async getActiveSession(): Promise<SessionWithTable | null> {
     const res = apiClient.get(
      '/tables/sessions/active',
      ApiResponseSchema(SessionWithTableSchema.nullable())
    );
    console.log(res)
  return res;
  }

  async printReceipt(sessionId: string, wifiPassword?: string): Promise<boolean> {
    return apiClient.post(
      `/tables/sessions/${sessionId}/print-receipt`,
      ApiResponseSchema(z.boolean()),
      wifiPassword ? { wifiPassword } : {}
    );
  }

  async downloadReceiptPreview(sessionId: string): Promise<Blob> {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://3qrbqpcx-5212.asse.devtunnels.ms/';
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${baseURL}tables/sessions/${sessionId}/receipt-preview`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to download receipt preview');
    }
    
    return await response.blob();
  }
}

export const tableService = new TableService();