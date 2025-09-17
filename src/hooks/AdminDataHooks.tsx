import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/api.client";
import { ApiResponseSchema } from "../schema/api.schema";
import {
  UserWithInfoSchema,
  TransactionWithUserSchema,
  CreateTableRequestSchema,
  CreatePremiseQRRequestSchema,
} from "../schema/admin.schema";
import { PremiseQrCodeSchema } from "../schema/premise.schema";
import { z } from "zod";

export const useUsersManagement = () => {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () =>
      apiClient.get(
        "/admin/users",
        ApiResponseSchema(z.array(UserWithInfoSchema))
      ),
  });

  const toggleAdminMutation = useMutation({
    mutationFn: (userId: string) =>
      apiClient.post(
        "/admin/users/toggle-admin",
        ApiResponseSchema(z.object({ isAdmin: z.boolean() })),
        { userId }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  return {
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    toggleAdmin: toggleAdminMutation,
    refetch: usersQuery.refetch,
  };
};

export const useTransactionsManagement = () => {
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ["admin", "transactions", "pending"],
    queryFn: () =>
      apiClient.get(
        "/admin/transactions/pending",
        ApiResponseSchema(z.array(TransactionWithUserSchema))
      ),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const approveMutation = useMutation({
    mutationFn: (transactionId: string) =>
      apiClient.post(
        "/admin/transactions/approve",
        ApiResponseSchema(z.boolean()),
        { transactionId }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (transactionId: string) =>
      apiClient.post(
        "/admin/transactions/reject",
        ApiResponseSchema(z.boolean()),
        { transactionId }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
    },
  });

  return {
    transactions: transactionsQuery.data || [],
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    approve: approveMutation,
    reject: rejectMutation,
    refetch: transactionsQuery.refetch,
  };
};

export const useTablesManagement = () => {
  const queryClient = useQueryClient();

  const tablesQuery = useQuery({
    queryKey: ["admin", "tables"],
    queryFn: () =>
      apiClient.get("/tables", ApiResponseSchema(z.array(z.any()))), // Using StudyTableSchema
  });

  const createTableMutation = useMutation({
    mutationFn: (data: any) => {
      CreateTableRequestSchema.parse(data);
      return apiClient.post(
        "/admin/tables/create",
        ApiResponseSchema(
          z.object({
            tableId: z.string(),
            qrCode: z.string(),
          })
        ),
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tables"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });

  return {
    tables: tablesQuery.data || [],
    isLoading: tablesQuery.isLoading,
    error: tablesQuery.error,
    createTable: createTableMutation,
    refetch: tablesQuery.refetch,
  };
};

export const usePremiseManagement = () => {
  const queryClient = useQueryClient();

  const premiseCodesQuery = useQuery({
    queryKey: ["admin", "premise", "codes"],
    queryFn: () =>
      apiClient.get(
        "/premise/qr-codes",
        ApiResponseSchema(z.array(PremiseQrCodeSchema))
      ),
  });

  const createCodeMutation = useMutation({
    mutationFn: (data: any) => {
      CreatePremiseQRRequestSchema.parse(data);
      return apiClient.post(
        "/premise/create-qr",
        ApiResponseSchema(
          z.object({
            premiseId: z.string(),
            code: z.string(),
          })
        ),
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "premise"] });
    },
  });

  return {
    codes: premiseCodesQuery.data || [],
    isLoading: premiseCodesQuery.isLoading,
    error: premiseCodesQuery.error,
    createCode: createCodeMutation,
    refetch: premiseCodesQuery.refetch,
  };
};
