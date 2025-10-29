import { useQuery } from "@tanstack/react-query";
import rateService from "../services/rate.service";
import { Rate } from "../schema/rate.schema";

/**
 * Hook to fetch all rates
 */
export const useRates = () => {
  return useQuery({
    queryKey: ["rates"],
    queryFn: () => rateService.getAllRates(),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};

/**
 * Hook to fetch active rates only
 */
export const useActiveRates = () => {
  const { data: allRates, ...rest } = useRates();
  
  const activeRates = allRates?.filter(rate => rate.isActive) || [];
  
  return {
    ...rest,
    data: activeRates,
    rates: activeRates,
  };
};

/**
 * Hook to get a specific rate by ID
 */
export const useRate = (rateId: string) => {
  const { data: rates, ...rest } = useRates();
  
  const rate = rates?.find(r => r.id === rateId);
  
  return {
    ...rest,
    data: rate,
    rate,
  };
};