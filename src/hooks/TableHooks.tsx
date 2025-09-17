import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tableService } from '../services/table.service';
import { StartSessionRequest } from '../schema/table.schema';

export const useTables = () => {
  const queryClient = useQueryClient();

  const tablesQuery = useQuery({
    queryKey: ['tables'],
    queryFn: tableService.getAllTables,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const activeSessionQuery = useQuery({
    queryKey: ['tables', 'activeSession'],
    queryFn: tableService.getActiveSession,
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
  });

  const startSessionMutation = useMutation({
    mutationFn: (request: StartSessionRequest) => tableService.startSession(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'credits'] });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: (sessionId: string) => tableService.endSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'credits'] });
    },
  });

  return {
    tables: tablesQuery.data || [],
    isLoadingTables: tablesQuery.isLoading,
    activeSession: activeSessionQuery.data,
    isLoadingActiveSession: activeSessionQuery.isLoading,
    startSession: startSessionMutation,
    endSession: endSessionMutation,
    refetchTables: tablesQuery.refetch,
    refetchActiveSession: activeSessionQuery.refetch,
  };
};

export const useTableByQR = (qrCode: string | null) => {
  return useQuery({
    queryKey: ['tables', 'qr', qrCode],
    queryFn: () => tableService.getTableByQR(qrCode!),
    enabled: !!qrCode,
    staleTime: 1000 * 60, // 1 minute
  });
};
