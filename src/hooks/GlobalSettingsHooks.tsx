import { useQuery } from "@tanstack/react-query";
import globalSettingsService from "../services/global-settings.service";

/**
 * Hook to fetch a specific global setting value by key
 */
export const useGlobalSetting = (key: string) => {
  return useQuery({
    queryKey: ["globalSetting", key],
    queryFn: () => globalSettingsService.getSettingValue(key),
    enabled: !!key, // Only run if key is provided
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1, // Only retry once on failure
  });
};

/**
 * Hook to fetch the hourly rate from global settings
 */
export const useHourlyRate = () => {
  const { data, isLoading, error } = useGlobalSetting("hourly_rate");
  
  // Parse the value as number, fallback to 100 if not found or invalid
  const rate = data && typeof data === 'string' ? parseFloat(data) : 100;
  
  return {
    hourlyRate: isNaN(rate) ? 100 : rate,
    isLoading,
    error,
    rawValue: data,
  };
};

/**
 * Hook to fetch all global settings
 */
export const useGlobalSettings = () => {
  return useQuery({
    queryKey: ["globalSettings"],
    queryFn: () => globalSettingsService.getAllSettings(),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};