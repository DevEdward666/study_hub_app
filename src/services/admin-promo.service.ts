import { apiClient } from './api.client';
import { ApiResponseSchema } from '../schema/api.schema';
import {
  PromoDto,
  PromoDtoSchema,
  CreatePromoRequest,
  UpdatePromoRequest,
  ValidatePromoRequest,
  ApplyPromoResponse,
  ApplyPromoResponseSchema,
PromoUsageDto,
  PromoUsageDtoSchema,
  PromoStatisticsDto,
  PromoStatisticsDtoSchema,
  TogglePromoStatusRequest,
  PromoStatus,
} from '../schema/promo.schema';
import { z } from 'zod';

export class AdminPromoService {
  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Get all promos (admin only)
   */
  async getAllPromos(includeInactive: boolean = false): Promise<PromoDto[]> {
    return apiClient.get(
      `/admin/promos?includeInactive=${includeInactive}`,
      ApiResponseSchema(z.array(PromoDtoSchema))
    );
  }

  /**
   * Get promo by ID (admin only)
   */
  async getPromoById(promoId: string): Promise<PromoDto> {
    return apiClient.get(
      `/admin/promos/${promoId}`,
      ApiResponseSchema(PromoDtoSchema)
    );
  }

  /**
   * Get promo by code (admin only)
   */
  async getPromoByCode(code: string): Promise<PromoDto> {
    return apiClient.get(
      `/admin/promos/code/${code}`,
      ApiResponseSchema(PromoDtoSchema)
    );
  }

  /**
   * Create a new promo (admin only)
   */
  async createPromo(request: CreatePromoRequest): Promise<PromoDto> {
    return apiClient.post(
      '/admin/promos/create',
      ApiResponseSchema(PromoDtoSchema),
      request
    );
  }

  /**
   * Update existing promo (admin only)
   */
  async updatePromo(request: UpdatePromoRequest): Promise<PromoDto> {
    return apiClient.put(
      '/admin/promos/update',
      ApiResponseSchema(PromoDtoSchema),
      request
    );
  }

  /**
   * Delete promo (soft delete) (admin only)
   */
  async deletePromo(promoId: string): Promise<boolean> {
    return apiClient.delete(
      `/admin/promos/delete/${promoId}`,
      ApiResponseSchema(z.boolean())
    );
  }

  /**
   * Toggle promo status (admin only)
   */
  async togglePromoStatus(request: TogglePromoStatusRequest): Promise<PromoDto> {
    return apiClient.patch(
      '/admin/promos/toggle-status',
      ApiResponseSchema(PromoDtoSchema),
      request
    );
  }

  /**
   * Get promo usage history (admin only)
   */
  async getPromoUsageHistory(promoId: string): Promise<PromoUsageDto[]> {
    return apiClient.get(
      `/admin/promos/${promoId}/usage-history`,
      ApiResponseSchema(z.array(PromoUsageDtoSchema))
    );
  }

  /**
   * Get promo statistics (admin only)
   */
  async getPromoStatistics(promoId: string): Promise<PromoStatisticsDto> {
    return apiClient.get(
      `/admin/promos/${promoId}/statistics`,
      ApiResponseSchema(PromoStatisticsDtoSchema)
    );
  }

  /**
   * Get all promo statistics (admin only)
   */
  async getAllPromoStatistics(): Promise<PromoStatisticsDto[]> {
    return apiClient.get(
      '/admin/promos/statistics/all',
      ApiResponseSchema(z.array(PromoStatisticsDtoSchema))
    );
  }

  // ==================== USER ENDPOINTS ====================

  /**
   * Get available promos for users
   */
  async getAvailablePromos(): Promise<PromoDto[]> {
    return apiClient.get(
      '/user/promos/available',
      ApiResponseSchema(z.array(PromoDtoSchema))
    );
  }

  /**
   * Validate promo code
   */
  async validatePromo(request: ValidatePromoRequest): Promise<ApplyPromoResponse> {
    return apiClient.post(
      '/user/promos/validate',
      ApiResponseSchema(ApplyPromoResponseSchema),
      request
    );
  }

  // ==================== HELPER METHODS ====================

  /**
   * Calculate bonus amount based on promo type
   */
  calculateBonusAmount(promo: PromoDto, purchaseAmount: number): number {
    switch (promo.type) {
      case 'Percentage':
        if (!promo.percentageBonus) return 0;
        let bonus = purchaseAmount * (promo.percentageBonus / 100);
        if (promo.maxDiscountAmount && bonus > promo.maxDiscountAmount) {
          bonus = promo.maxDiscountAmount;
        }
        return Math.round(bonus * 100) / 100;

      case 'FixedAmount':
        return promo.fixedBonusAmount || 0;

      case 'BuyXGetY':
        if (!promo.buyAmount || !promo.getAmount) return 0;
        const multiplier = Math.floor(purchaseAmount / promo.buyAmount);
        return multiplier * promo.getAmount;

      default:
        return 0;
    }
  }

  /**
   * Check if promo is currently valid
   */
  isPromoValid(promo: PromoDto): boolean {
    if (promo.status !== PromoStatus.Active) return false;

    const now = new Date();
    
    if (promo.startDate) {
      const startDate = new Date(promo.startDate);
      if (now < startDate) return false;
    }

    if (promo.endDate) {
      const endDate = new Date(promo.endDate);
      if (now > endDate) return false;
    }

    if (promo.usageLimit && promo.currentUsageCount >= promo.usageLimit) {
      return false;
    }

    return true;
  }

  /**
   * Format promo display string
   */
  formatPromoDiscount(promo: PromoDto): string {
    switch (promo.type) {
      case 'Percentage':
        return `${promo.percentageBonus}% Bonus`;
      case 'FixedAmount':
        return `+${promo.fixedBonusAmount} Credits`;
      case 'BuyXGetY':
        return `Buy ${promo.buyAmount}, Get ${promo.getAmount}`;
      default:
        return 'Unknown';
    }
  }

  /**
   * Get promo status badge color
   */
  getStatusColor(status: PromoStatus): string {
    switch (status) {
      case PromoStatus.Active:
        return 'success';
      case PromoStatus.Inactive:
        return 'medium';
      case PromoStatus.Expired:
        return 'danger';
      case PromoStatus.Scheduled:
        return 'warning';
      default:
        return 'medium';
    }
  }
}

// Export singleton instance
export const adminPromoService = new AdminPromoService();

