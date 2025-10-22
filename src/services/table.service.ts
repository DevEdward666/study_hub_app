import { apiClient } from './api.client';
import {
  StudyTable,
  SessionWithTable,
  StartSessionRequest,
  EndSessionResponse,
  StudyTableSchema,
  SessionWithTableSchema,
  StartSessionRequestSchema,
  EndSessionResponseSchema
} from '../schema/table.schema';
import { ApiResponseSchema } from '../schema/api.schema';
import { z } from 'zod';

export class TableService {
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

  async endSession(sessionId: string): Promise<EndSessionResponse> {
    return apiClient.post(
      '/tables/sessions/end',
      ApiResponseSchema(EndSessionResponseSchema),
      sessionId
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
}

export const tableService = new TableService();