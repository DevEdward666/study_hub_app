import { apiClient } from './api.client';
import { ApiResponseSchema } from '../schema/api.schema';
import { PromoSchema, Promo } from '../hooks/PromoHooks';
import { z } from 'zod';

export class PromoService {
  // Mock data for testing - replace with actual API calls
  private mockPromos: Promo[] = [
    {
      id: '1',
      name: 'First Timer',
      description: '20% off for new users',
      discountType: 'percentage',
      discountValue: 20,
      minPurchase: 10,
      maxDiscount: 5,
      isActive: true,
      validFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      usageLimit: 1000,
      usedCount: 150,
      targetPackages: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Happy Hour',
      description: '5 credits off during happy hours',
      discountType: 'fixed',
      discountValue: 5,
      minPurchase: 20,
      isActive: true,
      validFrom: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      usageLimit: 500,
      usedCount: 75,
      targetPackages: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Weekend Study',
      description: '15% off weekend sessions',
      discountType: 'percentage',
      discountValue: 15,
      minPurchase: 15,
      maxDiscount: 10,
      isActive: true,
      validFrom: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      validTo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      usageLimit: 300,
      usedCount: 45,
      targetPackages: [],
      createdAt: new Date().toISOString(),
    },
  ];

  async getActivePromos(): Promise<Promo[]> {
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const now = new Date();
    return this.mockPromos.filter(promo => {
      const validFrom = new Date(promo.validFrom);
      const validTo = new Date(promo.validTo);
      return promo.isActive && now >= validFrom && now <= validTo;
    });

    // TODO: Replace with actual API call
    // return apiClient.get(
    //   '/promos/active',
    //   ApiResponseSchema(z.array(PromoSchema))
    // );
  }

  async getApplicablePromos(amount: number): Promise<Promo[]> {
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const activePromos = await this.getActivePromos();
    return activePromos.filter(promo => amount >= promo.minPurchase);

    // TODO: Replace with actual API call
    // return apiClient.get(
    //   `/promos/applicable?amount=${amount}`,
    //   ApiResponseSchema(z.array(PromoSchema))
    // );
  }

  async getAllPromos(): Promise<Promo[]> {
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return this.mockPromos;

    // TODO: Replace with actual API call
    // return apiClient.get(
    //   '/promos',
    //   ApiResponseSchema(z.array(PromoSchema))
    // );
  }

  async createPromo(promo: Omit<Promo, 'id' | 'usedCount' | 'createdAt'>): Promise<Promo> {
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newPromo: Promo = {
      ...promo,
      id: `mock_${Date.now()}`,
      usedCount: 0,
      createdAt: new Date().toISOString(),
    };
    
    this.mockPromos.push(newPromo);
    return newPromo;

    // TODO: Replace with actual API call
    // return apiClient.post(
    //   '/promos',
    //   ApiResponseSchema(PromoSchema),
    //   promo
    // );
  }

  async updatePromo(id: string, promo: Partial<Promo>): Promise<Promo> {
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const index = this.mockPromos.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Promo not found');
    }
    
    this.mockPromos[index] = { ...this.mockPromos[index], ...promo };
    return this.mockPromos[index];

    // TODO: Replace with actual API call
    // return apiClient.put(
    //   `/promos/${id}`,
    //   ApiResponseSchema(PromoSchema),
    //   promo
    // );
  }

  async deletePromo(id: string): Promise<void> {
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const index = this.mockPromos.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Promo not found');
    }
    
    this.mockPromos.splice(index, 1);

    // TODO: Replace with actual API call
    // return apiClient.delete(`/promos/${id}`);
  }

  async applyPromo(promoId: string, sessionCost: number): Promise<{ discount: number; finalCost: number }> {
    // Mock API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const promo = this.mockPromos.find(p => p.id === promoId);
    if (!promo) {
      throw new Error('Promo not found');
    }

    const now = new Date();
    const validFrom = new Date(promo.validFrom);
    const validTo = new Date(promo.validTo);

    if (!promo.isActive || now < validFrom || now > validTo) {
      throw new Error('Promo is not active or has expired');
    }

    if (sessionCost < promo.minPurchase) {
      throw new Error(`Minimum purchase amount is ${promo.minPurchase} credits`);
    }

    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      throw new Error('Promo usage limit reached');
    }

    let discount = 0;
    if (promo.discountType === 'percentage') {
      discount = (sessionCost * promo.discountValue) / 100;
      if (promo.maxDiscount && discount > promo.maxDiscount) {
        discount = promo.maxDiscount;
      }
    } else {
      discount = Math.min(promo.discountValue, sessionCost);
    }

    const finalCost = sessionCost - discount;

    // Increment usage count in mock data
    promo.usedCount += 1;

    return { discount, finalCost };

    // TODO: Replace with actual API call
    // return apiClient.post(
    //   `/promos/${promoId}/apply`,
    //   ApiResponseSchema(z.object({
    //     discount: z.number(),
    //     finalCost: z.number(),
    //   })),
    //   { sessionCost }
    // );
  }
}

export const promoService = new PromoService();