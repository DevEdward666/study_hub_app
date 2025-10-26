import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/api.client";
import { userService } from "../services/user.service";
import { ApiResponseSchema } from "../schema/api.schema";
import {
  UserWithInfoSchema,
  TransactionWithUserSchema,
  CreateTableRequestSchema,
  CreatePremiseQRRequestSchema,
  UpdateTableRequestSchema,
  SelectedTable,
  getTransactionWithUserTableSchema,
  GetTransactionWithUserTableKeys,
  getTransactionWithUserSchema,
} from "../schema/admin.schema";
import {
  getPremiseSchema,
  GetPremiseTableKeys,
  getPremiseTableSchema,
  PremiseQrCodeSchema,
} from "../schema/premise.schema";
import { z } from "zod";
import { TableState } from "@/shared/DynamicTable/Interface/TableInterface";
import { PaginatedResponseSchema } from "@/shared/DynamicTable/TableProperties";
import {
  getTablesSchema,
  GetTablesTableKeys,
  getTablesTableSchema,
  StudyTableSchema,
} from "@/schema/table.schema";

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

  const addCreditsMutation = useMutation({
    mutationFn: ({ userId, amount, creditType }: { userId: string; amount: number; creditType: string }) =>
      userService.addCreditsAsAdmin(userId, amount, creditType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      apiClient.post(
        "/admin/users/create",
        ApiResponseSchema(UserWithInfoSchema),
        { name, email, password }
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
    addCredits: addCreditsMutation,
    createUser: createUserMutation,
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

  const allTransactionsQuery = useQuery({
    queryKey: ["admin", "transactions", "all"],
    queryFn: () =>
      apiClient.get(
        "/admin/transactions/all",
        ApiResponseSchema(z.array(TransactionWithUserSchema))
      ),
    refetchInterval: 60000, // Refresh every 60 seconds
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
    allTransactions: allTransactionsQuery.data || [],
    isLoading: transactionsQuery.isLoading,
    isLoadingAll: allTransactionsQuery.isLoading,
    error: transactionsQuery.error,
    approve: approveMutation,
    reject: rejectMutation,
    refetch: transactionsQuery.refetch,
    refetchAll: allTransactionsQuery.refetch,
  };
};
export class TransactionManagementServiceAPI {
  static async fetchTransactions(state: TableState) {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const fetchTransactionManagement = await apiClient.get(
      "/admin/transactions/pending",
      ApiResponseSchema(z.array(TransactionWithUserSchema))
    );
    console.log(fetchTransactionManagement);
    const parsed = getTransactionWithUserTableSchema.parse({
      data: Array.isArray(fetchTransactionManagement)
        ? fetchTransactionManagement
        : [fetchTransactionManagement],
    });

    let filteredTransactionWithUserTable = [...parsed.data];
    if (state.search) {
      const searchTerm = state.search.toLowerCase();
      filteredTransactionWithUserTable =
        filteredTransactionWithUserTable.filter(
          (val) =>
            val.id?.toString()?.toLowerCase().includes(searchTerm) ||
            val.amount?.toString().toLowerCase().includes(searchTerm) ||
            val.cost.toString()?.toLowerCase().includes(searchTerm) ||
            val.paymentMethod?.toString().toLowerCase().includes(searchTerm) ||
            val.user.toString()?.toLowerCase().includes(searchTerm)
        );
    }

    const sortBy: GetTransactionWithUserTableKeys =
      state.sortBy as GetTransactionWithUserTableKeys;
    filteredTransactionWithUserTable.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return state.sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return state.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    const total = filteredTransactionWithUserTable.length;
    const totalPages = Math.ceil(total / state.pageSize);
    const safePage = Math.min(state.page, totalPages || 1);
    const startIndex = (safePage - 1) * state.pageSize;
    const paginatedUsers = filteredTransactionWithUserTable.slice(
      startIndex,
      startIndex + state.pageSize
    );
    const response = {
      data: paginatedUsers,
      total,
      page: safePage,
      pageSize: state.pageSize,
      totalPages,
    };
    const GetfilteredeTransactionWithUserTableSchema = PaginatedResponseSchema(
      getTransactionWithUserSchema
    );
    const parsedResponse =
      GetfilteredeTransactionWithUserTableSchema.parse(response);

    return parsedResponse;
  }

  static async fetchAllTransactions(state: TableState) {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const fetchAllTransactions = await apiClient.get(
      "/admin/transactions/all",
      ApiResponseSchema(z.array(TransactionWithUserSchema))
    );
    console.log(fetchAllTransactions);
    const parsed = getTransactionWithUserTableSchema.parse({
      data: Array.isArray(fetchAllTransactions)
        ? fetchAllTransactions
        : [fetchAllTransactions],
    });

    let filteredTransactionWithUserTable = [...parsed.data];
    if (state.search) {
      const searchTerm = state.search.toLowerCase();
      filteredTransactionWithUserTable =
        filteredTransactionWithUserTable.filter(
          (val) =>
            val.id?.toString()?.toLowerCase().includes(searchTerm) ||
            val.amount?.toString().toLowerCase().includes(searchTerm) ||
            val.cost.toString()?.toLowerCase().includes(searchTerm) ||
            val.paymentMethod?.toString().toLowerCase().includes(searchTerm) ||
            val.status?.toString().toLowerCase().includes(searchTerm) ||
            val.user.name?.toString().toLowerCase().includes(searchTerm) ||
            val.user.email?.toString().toLowerCase().includes(searchTerm)
        );
    }

    const sortBy: GetTransactionWithUserTableKeys =
      state.sortBy as GetTransactionWithUserTableKeys;
    filteredTransactionWithUserTable.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return state.sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return state.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    const total = filteredTransactionWithUserTable.length;
    const totalPages = Math.ceil(total / state.pageSize);
    const safePage = Math.min(state.page, totalPages || 1);
    const startIndex = (safePage - 1) * state.pageSize;
    const paginatedUsers = filteredTransactionWithUserTable.slice(
      startIndex,
      startIndex + state.pageSize
    );
    const response = {
      data: paginatedUsers,
      total,
      page: safePage,
      pageSize: state.pageSize,
      totalPages,
    };
    const GetfilteredeTransactionWithUserTableSchema = PaginatedResponseSchema(
      getTransactionWithUserSchema
    );
    const parsedResponse =
      GetfilteredeTransactionWithUserTableSchema.parse(response);

    return parsedResponse;
  }
}
export const useTablesManagement = () => {
  const queryClient = useQueryClient();

  const tablesQuery = useQuery({
    queryKey: ["admin", "tables"],
    queryFn: () =>
      apiClient.get("/tables", ApiResponseSchema(z.array(z.any()))),
  });
  const selectedTable = useMutation({
    mutationFn: (data: any) => {
      SelectedTable.parse(data);
      return apiClient.post(
        "/admin/tables/selected",
        ApiResponseSchema(
          z.object({
            tableID: z.string(),
            tableNumber: z.string(),
            hourlyRate: z.number(),
            location: z.string(),
            capacity: z.number(),
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
  const updateTableMutation = useMutation({
    mutationFn: (data: any) => {
      UpdateTableRequestSchema.parse(data);
      return apiClient.put(
        "/admin/tables/update",
        ApiResponseSchema(
          z.object({
            tableNumber: z.string(),
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
    updateTable: updateTableMutation,
    selectedTable: selectedTable,
    refetch: tablesQuery.refetch,
  };
};
export class TableManagementServiceAPI {
  static async fetchTables(state: TableState) {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const fetchTablesManagement = await apiClient.get(
      `/tables`,
      ApiResponseSchema(z.array(StudyTableSchema))
    );

    // Debug: Log the raw API response
    console.log("Raw API Response from /tables:", fetchTablesManagement);

    const parsed = getTablesTableSchema.parse({
      data: Array.isArray(fetchTablesManagement)
        ? fetchTablesManagement
        : [fetchTablesManagement],
    });
    let filteredetTablesTable = [...parsed.data];
    if (state.search) {
      const searchTerm = state.search.toLowerCase();
      filteredetTablesTable = filteredetTablesTable.filter(
        (val) =>
          val.id?.toString()?.toLowerCase().includes(searchTerm) ||
          val.capacity?.toString().toLowerCase().includes(searchTerm) ||
          val.location.toString()?.toLowerCase().includes(searchTerm) ||
          val.hourlyRate?.toString().toLowerCase().includes(searchTerm) ||
          val.tableNumber.toString()?.toLowerCase().includes(searchTerm)
      );
    }

    const sortBy: GetTablesTableKeys = state.sortBy as GetTablesTableKeys;
    filteredetTablesTable.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return state.sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return state.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    const total = filteredetTablesTable.length;
    const totalPages = Math.ceil(total / state.pageSize);
    const safePage = Math.min(state.page, totalPages || 1);
    const startIndex = (safePage - 1) * state.pageSize;
    const paginatedUsers = filteredetTablesTable.slice(
      startIndex,
      startIndex + state.pageSize
    );
    const response = {
      data: paginatedUsers,
      total,
      page: safePage,
      pageSize: state.pageSize,
      totalPages,
    };
    const GetfilteredetTablesTableSchema =
      PaginatedResponseSchema(getTablesSchema);
    const parsedResponse = GetfilteredetTablesTableSchema.parse(response);

    return parsedResponse;
  }
}
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
export class PremiseManagementServiceAPI {
  static async fetchPremises(state: TableState) {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const fetchPremsiseManagement = await apiClient.get(
      `/premise/qr-codes`,
      ApiResponseSchema(z.array(PremiseQrCodeSchema))
    );
    const parsed = getPremiseTableSchema.parse({
      data: Array.isArray(fetchPremsiseManagement)
        ? fetchPremsiseManagement
        : [fetchPremsiseManagement],
    });

    let filteredetPremiseTable = [...parsed.data];
    if (state.search) {
      const searchTerm = state.search.toLowerCase();
      filteredetPremiseTable = filteredetPremiseTable.filter(
        (val) =>
          val.id?.toString()?.toLowerCase().includes(searchTerm) ||
          val.code?.toString().toLowerCase().includes(searchTerm) ||
          val.location.toString()?.toLowerCase().includes(searchTerm) ||
          val.isActive?.toString().toLowerCase().includes(searchTerm) ||
          val.validityHours.toString()?.toLowerCase().includes(searchTerm)
      );
    }

    const sortBy: GetPremiseTableKeys = state.sortBy as GetPremiseTableKeys;
    filteredetPremiseTable.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return state.sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return state.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    const total = filteredetPremiseTable.length;
    const totalPages = Math.ceil(total / state.pageSize);
    const safePage = Math.min(state.page, totalPages || 1);
    const startIndex = (safePage - 1) * state.pageSize;
    const paginatedUsers = filteredetPremiseTable.slice(
      startIndex,
      startIndex + state.pageSize
    );
    const response = {
      data: paginatedUsers,
      total,
      page: safePage,
      pageSize: state.pageSize,
      totalPages,
    };
    const GetfilteredetPremiseTableTableSchema =
      PaginatedResponseSchema(getPremiseSchema);
    const parsedResponse = GetfilteredetPremiseTableTableSchema.parse(response);

    return parsedResponse;
  }
}
