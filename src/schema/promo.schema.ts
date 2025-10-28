import { z } from 'zod';

// Backend Promo Type Enums
export enum PromoType {
  Percentage = 'Percentage',
  FixedAmount = 'FixedAmount',
  BuyXGetY = 'BuyXGetY'
}

export enum PromoStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Expired = 'Expired',
  Scheduled = 'Scheduled'
}

// Admin Promo DTO Schemas (matching backend)
export const PromoDtoSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.nativeEnum(PromoType),
  status: z.nativeEnum(PromoStatus),
  percentageBonus: z.number().nullable(),
  fixedBonusAmount: z.number().nullable(),
  buyAmount: z.number().nullable(),
  getAmount: z.number().nullable(),
  minPurchaseAmount: z.number().nullable(),
  maxDiscountAmount: z.number().nullable(),
  usageLimit: z.number().nullable(),
  usagePerUser: z.number().nullable(),
  currentUsageCount: z.number(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  creatorEmail: z.string().nullable(),
});

export const CreatePromoRequestSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.nativeEnum(PromoType),
  percentageBonus: z.number().min(0).max(100).optional(),
  fixedBonusAmount: z.number().min(0.01).optional(),
  buyAmount: z.number().min(0.01).optional(),
  getAmount: z.number().min(0.01).optional(),
  minPurchaseAmount: z.number().min(0.01).optional(),
  maxDiscountAmount: z.number().min(0.01).optional(),
  usageLimit: z.number().min(1).optional(),
  usagePerUser: z.number().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const UpdatePromoRequestSchema = z.object({
  promoId: z.string().uuid(),
  name: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  status: z.nativeEnum(PromoStatus).optional(),
  percentageBonus: z.number().min(0).max(100).optional(),
  fixedBonusAmount: z.number().min(0.01).optional(),
  buyAmount: z.number().min(0.01).optional(),
  getAmount: z.number().min(0.01).optional(),
  minPurchaseAmount: z.number().min(0.01).optional(),
  maxDiscountAmount: z.number().min(0.01).optional(),
  usageLimit: z.number().min(1).optional(),
  usagePerUser: z.number().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const ValidatePromoRequestSchema = z.object({
  promoCode: z.string().min(1),
  purchaseAmount: z.number().min(0.01),
});

export const ApplyPromoResponseSchema = z.object({
  isValid: z.boolean(),
  message: z.string().nullable(),
  originalAmount: z.number(),
  bonusAmount: z.number(),
  totalAmount: z.number(),
  promoDetails: PromoDtoSchema.nullable(),
});

export const PromoUsageDtoSchema = z.object({
  id: z.string().uuid(),
  promoId: z.string().uuid(),
  promoCode: z.string(),
  promoName: z.string(),
  userId: z.string().uuid(),
  userEmail: z.string(),
  transactionId: z.string().uuid(),
  purchaseAmount: z.number(),
  bonusAmount: z.number(),
  usedAt: z.string(),
});

export const PromoStatisticsDtoSchema = z.object({
  promoId: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  totalUsageCount: z.number(),
  uniqueUsersCount: z.number(),
  totalBonusGiven: z.number(),
  totalPurchaseAmount: z.number(),
  lastUsedAt: z.string().nullable(),
});

export const TogglePromoStatusRequestSchema = z.object({
  promoId: z.string().uuid(),
  status: z.nativeEnum(PromoStatus),
});

// TypeScript types
export type PromoDto = z.infer<typeof PromoDtoSchema>;
export type CreatePromoRequest = z.infer<typeof CreatePromoRequestSchema>;
export type UpdatePromoRequest = z.infer<typeof UpdatePromoRequestSchema>;
export type ValidatePromoRequest = z.infer<typeof ValidatePromoRequestSchema>;
export type ApplyPromoResponse = z.infer<typeof ApplyPromoResponseSchema>;
export type PromoUsageDto = z.infer<typeof PromoUsageDtoSchema>;
export type PromoStatisticsDto = z.infer<typeof PromoStatisticsDtoSchema>;
export type TogglePromoStatusRequest = z.infer<typeof TogglePromoStatusRequestSchema>;

