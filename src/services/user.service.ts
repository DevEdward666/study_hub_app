import { apiClient } from './api.client';
import {
  UserCredits,
  CreditTransaction,
  PurchaseCreditsRequest,
  UserCreditsSchema,
  CreditTransactionSchema,
  PurchaseCreditsRequestSchema
} from '../schema/user.schema';
import { SessionWithTable, SessionWithTableSchema } from '../schema/table.schema';
import { ApiResponseSchema } from '../schema/api.schema';
import { z } from 'zod';

export class UserService {
  async getUserCredits(): Promise<UserCredits | null> {
    return apiClient.get(
      '/user/credits',
      ApiResponseSchema(UserCreditsSchema.nullable())
    );
  }

  async initializeCredits(): Promise<UserCredits> {
    return apiClient.post(
      '/user/credits/initialize',
      ApiResponseSchema(UserCreditsSchema)
    );
  }

  async purchaseCredits(request: PurchaseCreditsRequest): Promise<string> {
    PurchaseCreditsRequestSchema.parse(request);
    return apiClient.post(
      '/user/credits/purchase',
      ApiResponseSchema(z.string()),
      request
    );
  }

  async getUserTransactions(): Promise<CreditTransaction[]> {
    return apiClient.get(
      '/user/transactions',
      ApiResponseSchema(z.array(CreditTransactionSchema))
    );
  }

  async getUserSessions(): Promise<SessionWithTable[]> {
    return apiClient.get(
      '/user/sessions',
      ApiResponseSchema(z.array(SessionWithTableSchema))
    );
  }
}

export const userService = new UserService();