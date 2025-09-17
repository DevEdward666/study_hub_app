import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { premiseService } from '../services/premise.service';
import { ActivatePremiseRequest } from '../schema/premise.schema';

export const usePremise = () => {
  const queryClient = useQueryClient();

  const accessQuery = useQuery({
    queryKey: ['premise', 'access'],
    queryFn: premiseService.checkPremiseAccess,
    refetchInterval: 1000 * 60, // Refetch every minute to check expiration
  });

  const activateAccessMutation = useMutation({
    mutationFn: (request: ActivatePremiseRequest) => premiseService.activatePremiseAccess(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premise', 'access'] });
    },
  });

  const cleanupExpiredMutation = useMutation({
    mutationFn: premiseService.cleanupExpiredAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premise', 'access'] });
    },
  });

  return {
    access: accessQuery.data,
    isLoadingAccess: accessQuery.isLoading,
    activateAccess: activateAccessMutation,
    cleanupExpired: cleanupExpiredMutation,
    refetchAccess: accessQuery.refetch,
  };
};