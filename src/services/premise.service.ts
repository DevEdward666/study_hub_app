import { apiClient } from './api.client';
import {
  ActivePremiseAccess,
  ActivatePremiseRequest,
  PremiseAccess,
  ActivePremiseAccessSchema,
  ActivatePremiseRequestSchema,
  PremiseAccessSchema
} from '../schema/premise.schema';
import { ApiResponseSchema } from '../schema/api.schema';
import { z } from 'zod';

export class PremiseService {
  async activatePremiseAccess(request: ActivatePremiseRequest): Promise<PremiseAccess> {
    ActivatePremiseRequestSchema.parse(request);
    return apiClient.post(
      '/premise/activate',
      ApiResponseSchema(PremiseAccessSchema),
      request
    );
  }

  async checkPremiseAccess(): Promise<ActivePremiseAccess | null> {
    return apiClient.get(
      '/premise/access',
      ApiResponseSchema(ActivePremiseAccessSchema.nullable())
    );
  }

  async cleanupExpiredAccess(): Promise<void> {
    return apiClient.post(
      '/premise/cleanup',
      ApiResponseSchema(z.void())
    );
  }
}

export const premiseService = new PremiseService();