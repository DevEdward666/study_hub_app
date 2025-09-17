import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../services/api.client";
import { ApiResponseSchema } from "../schema/api.schema";
import { z } from "zod";

export const useAdminStatus = () => {
  const query = useQuery({
    queryKey: ["admin", "status"],
    queryFn: () =>
      apiClient.get("/admin/is-admin", ApiResponseSchema(z.boolean())),
    retry: false,
  });

  return {
    isAdmin: query.data || false,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
