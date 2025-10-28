import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminPromoService } from '../services/admin-promo.service';
import {
  PromoDto,
  CreatePromoRequest,
  UpdatePromoRequest,
  TogglePromoStatusRequest,
  ValidatePromoRequest,
} from '../schema/promo.schema';
import { useIonToast } from '@ionic/react';

// Query Keys
export const PROMO_QUERY_KEYS = {
  all: ['admin', 'promos'] as const,
  list: (includeInactive?: boolean) => [...PROMO_QUERY_KEYS.all, 'list', includeInactive] as const,
  detail: (id: string) => [...PROMO_QUERY_KEYS.all, 'detail', id] as const,
  byCode: (code: string) => [...PROMO_QUERY_KEYS.all, 'code', code] as const,
  usage: (id: string) => [...PROMO_QUERY_KEYS.all, id, 'usage'] as const,
  statistics: (id: string) => [...PROMO_QUERY_KEYS.all, id, 'statistics'] as const,
  allStatistics: () => [...PROMO_QUERY_KEYS.all, 'statistics'] as const,
  available: () => ['user', 'promos', 'available'] as const,
};

// ==================== QUERY HOOKS ====================

/**
 * Get all promos (admin)
 */
export const useAdminPromos = (includeInactive: boolean = false) => {
  return useQuery({
    queryKey: PROMO_QUERY_KEYS.list(includeInactive),
    queryFn: () => adminPromoService.getAllPromos(includeInactive),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Get promo by ID (admin)
 */
export const usePromoById = (promoId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: PROMO_QUERY_KEYS.detail(promoId),
    queryFn: () => adminPromoService.getPromoById(promoId),
    enabled: enabled && !!promoId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Get promo by code (admin)
 */
export const usePromoByCode = (code: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: PROMO_QUERY_KEYS.byCode(code),
    queryFn: () => adminPromoService.getPromoByCode(code),
    enabled: enabled && !!code,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Get promo usage history (admin)
 */
export const usePromoUsageHistory = (promoId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: PROMO_QUERY_KEYS.usage(promoId),
    queryFn: () => adminPromoService.getPromoUsageHistory(promoId),
    enabled: enabled && !!promoId,
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Get promo statistics (admin)
 */
export const usePromoStatistics = (promoId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: PROMO_QUERY_KEYS.statistics(promoId),
    queryFn: () => adminPromoService.getPromoStatistics(promoId),
    enabled: enabled && !!promoId,
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Get all promo statistics (admin)
 */
export const useAllPromoStatistics = () => {
  return useQuery({
    queryKey: PROMO_QUERY_KEYS.allStatistics(),
    queryFn: () => adminPromoService.getAllPromoStatistics(),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Get available promos (user)
 */
export const useAvailablePromos = () => {
  return useQuery({
    queryKey: PROMO_QUERY_KEYS.available(),
    queryFn: () => adminPromoService.getAvailablePromos(),
    staleTime: 1000 * 60 * 5,
  });
};

// ==================== MUTATION HOOKS ====================

/**
 * Create promo mutation (admin)
 */
export const useCreatePromo = () => {
  const queryClient = useQueryClient();
  const [presentToast] = useIonToast();

  return useMutation({
    mutationFn: (request: CreatePromoRequest) => adminPromoService.createPromo(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      presentToast({
        message: `Promo "${data.name}" created successfully!`,
        duration: 3000,
        color: 'success',
        position: 'top',
      });
    },
    onError: (error: Error) => {
      presentToast({
        message: error.message || 'Failed to create promo',
        duration: 4000,
        color: 'danger',
        position: 'top',
      });
    },
  });
};

/**
 * Update promo mutation (admin)
 */
export const useUpdatePromo = () => {
  const queryClient = useQueryClient();
  const [presentToast] = useIonToast();

  return useMutation({
    mutationFn: (request: UpdatePromoRequest) => adminPromoService.updatePromo(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.detail(data.id) });
      presentToast({
        message: `Promo "${data.name}" updated successfully!`,
        duration: 3000,
        color: 'success',
        position: 'top',
      });
    },
    onError: (error: Error) => {
      presentToast({
        message: error.message || 'Failed to update promo',
        duration: 4000,
        color: 'danger',
        position: 'top',
      });
    },
  });
};

/**
 * Delete promo mutation (admin)
 */
export const useDeletePromo = () => {
  const queryClient = useQueryClient();
  const [presentToast] = useIonToast();

  return useMutation({
    mutationFn: (promoId: string) => adminPromoService.deletePromo(promoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      presentToast({
        message: 'Promo deleted successfully!',
        duration: 3000,
        color: 'success',
        position: 'top',
      });
    },
    onError: (error: Error) => {
      presentToast({
        message: error.message || 'Failed to delete promo',
        duration: 4000,
        color: 'danger',
        position: 'top',
      });
    },
  });
};

/**
 * Toggle promo status mutation (admin)
 */
export const useTogglePromoStatus = () => {
  const queryClient = useQueryClient();
  const [presentToast] = useIonToast();

  return useMutation({
    mutationFn: (request: TogglePromoStatusRequest) => 
      adminPromoService.togglePromoStatus(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.detail(data.id) });
      presentToast({
        message: `Promo status updated to ${data.status}`,
        duration: 3000,
        color: 'success',
        position: 'top',
      });
    },
    onError: (error: Error) => {
      presentToast({
        message: error.message || 'Failed to update promo status',
        duration: 4000,
        color: 'danger',
        position: 'top',
      });
    },
  });
};

/**
 * Validate promo mutation (user)
 */
export const useValidatePromo = () => {
  const [presentToast] = useIonToast();

  return useMutation({
    mutationFn: (request: ValidatePromoRequest) => 
      adminPromoService.validatePromo(request),
    onError: (error: Error) => {
      presentToast({
        message: error.message || 'Failed to validate promo',
        duration: 4000,
        color: 'danger',
        position: 'top',
      });
    },
  });
};

// ==================== HELPER HOOKS ====================

/**
 * Hook to get promo helper functions
 */
export const usePromoHelpers = () => {
  return {
    calculateBonusAmount: adminPromoService.calculateBonusAmount.bind(adminPromoService),
    isPromoValid: adminPromoService.isPromoValid.bind(adminPromoService),
    formatPromoDiscount: adminPromoService.formatPromoDiscount.bind(adminPromoService),
    getStatusColor: adminPromoService.getStatusColor.bind(adminPromoService),
  };
};

