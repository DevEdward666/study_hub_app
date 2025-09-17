import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/user.service';
import { PurchaseCreditsRequest } from '../schema/user.schema';

export const useUser = () => {
  const queryClient = useQueryClient();

  const creditsQuery = useQuery({
    queryKey: ['user', 'credits'],
    queryFn: userService.getUserCredits,
    staleTime: 1000 * 60, // 1 minute
  });

  const transactionsQuery = useQuery({
    queryKey: ['user', 'transactions'],
    queryFn: userService.getUserTransactions,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const sessionsQuery = useQuery({
    queryKey: ['user', 'sessions'],
    queryFn: userService.getUserSessions,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const initializeCreditsMutation = useMutation({
    mutationFn: userService.initializeCredits,
    onSuccess: (data) => {
      queryClient.setQueryData(['user', 'credits'], data);
    },
  });

  const purchaseCreditsMutation = useMutation({
    mutationFn: (request: PurchaseCreditsRequest) => userService.purchaseCredits(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'credits'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'transactions'] });
    },
  });

  return {
    credits: creditsQuery.data,
    transactions: transactionsQuery.data || [],
    sessions: sessionsQuery.data || [],
    isLoadingCredits: creditsQuery.isLoading,
    isLoadingTransactions: transactionsQuery.isLoading,
    isLoadingSessions: sessionsQuery.isLoading,
    initializeCredits: initializeCreditsMutation,
    purchaseCredits: purchaseCreditsMutation,
    refetchCredits: creditsQuery.refetch,
    refetchTransactions: transactionsQuery.refetch,
    refetchSessions: sessionsQuery.refetch,
  };
};
