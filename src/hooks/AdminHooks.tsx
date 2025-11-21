import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/api.client";
import { ApiResponseSchema } from "@/schema/api.schema";
import { z } from "zod";

export const useAdminStatus = () => {
  const query = useQuery({
    queryKey: ["adminStatus"],
    queryFn: () =>
      apiClient.get("/admin/is-admin", ApiResponseSchema(z.boolean())),
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  });

  console.log("useAdminStatus query result:", query.data);

  return {
    isAdmin: query.data , // apiClient.get already unwraps ApiResponse and returns boolean directly
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};


