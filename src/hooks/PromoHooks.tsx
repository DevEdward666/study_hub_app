import { useQuery } from '@tanstack/react-query';
import { promoService } from '../services/promo.service';
import { z } from 'zod';

// Promo schema
export const PromoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number(),
  minPurchase: z.number(),
  maxDiscount: z.number().optional(),
  isActive: z.boolean(),
  validFrom: z.string(),
  validTo: z.string(),
  usageLimit: z.number().optional(),
  usedCount: z.number(),
  targetPackages: z.array(z.string()),
  createdAt: z.string(),
});

export type Promo = z.infer<typeof PromoSchema>;

export const useActivePromos = () => {
  return useQuery({
    queryKey: ['promos', 'active'],
    queryFn: promoService.getActivePromos,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useApplicablePromos = (purchaseAmount: number) => {
  return useQuery({
    queryKey: ['promos', 'applicable', purchaseAmount],
    queryFn: () => promoService.getApplicablePromos(purchaseAmount),
    enabled: purchaseAmount > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Calculate discount for a promo
export const calculatePromoDiscount = (promo: Promo, amount: number): number => {
  if (!promo.isActive || amount < promo.minPurchase) {
    return 0;
  }

  if (promo.discountType === 'percentage') {
    const percentageDiscount = (amount * promo.discountValue) / 100;
    if (promo.maxDiscount && percentageDiscount > promo.maxDiscount) {
      return promo.maxDiscount;
    }
    return percentageDiscount;
  } else {
    // Fixed discount
    return Math.min(promo.discountValue, amount);
  }
};

// Check if promo is valid for current date
export const isPromoValid = (promo: Promo): boolean => {
  const now = new Date();
  const validFrom = new Date(promo.validFrom);
  const validTo = new Date(promo.validTo);
  
  return now >= validFrom && now <= validTo && promo.isActive;
};