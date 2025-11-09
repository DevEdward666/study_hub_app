import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import subscriptionService from "../services/subscription.service";
import {
  CreateSubscriptionPackage,
  UpdateSubscriptionPackage,
  PurchaseSubscription,
  AdminPurchaseSubscription,
} from "../schema/subscription.schema";

// Package Hooks
export const useSubscriptionPackages = (activeOnly: boolean = false) => {
  return useQuery({
    queryKey: ["subscriptionPackages", activeOnly],
    queryFn: () => (activeOnly ? subscriptionService.getActivePackages() : subscriptionService.getAllPackages()),
  });
};

export const useSubscriptionPackage = (packageId: string) => {
  return useQuery({
    queryKey: ["subscriptionPackage", packageId],
    queryFn: () => subscriptionService.getPackageById(packageId),
    enabled: !!packageId,
  });
};

export const useCreatePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubscriptionPackage) => subscriptionService.createPackage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptionPackages"] });
    },
  });
};

export const useUpdatePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ packageId, data }: { packageId: string; data: UpdateSubscriptionPackage }) =>
      subscriptionService.updatePackage(packageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptionPackages"] });
    },
  });
};

export const useDeletePackage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (packageId: string) => subscriptionService.deletePackage(packageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptionPackages"] });
    },
  });
};

// User Subscription Hooks
export const useMySubscriptions = (activeOnly: boolean = false) => {
  return useQuery({
    queryKey: ["mySubscriptions", activeOnly],
    queryFn: () => subscriptionService.getMySubscriptions(activeOnly),
  });
};

export const useSubscription = (subscriptionId: string) => {
  return useQuery({
    queryKey: ["subscription", subscriptionId],
    queryFn: () => subscriptionService.getSubscriptionById(subscriptionId),
    enabled: !!subscriptionId,
  });
};

export const usePurchaseSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PurchaseSubscription) => subscriptionService.purchaseSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mySubscriptions"] });
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) => subscriptionService.cancelSubscription(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mySubscriptions"] });
    },
  });
};

export const useSubscriptionUsage = (subscriptionId: string) => {
  return useQuery({
    queryKey: ["subscriptionUsage", subscriptionId],
    queryFn: () => subscriptionService.getSubscriptionUsage(subscriptionId),
    enabled: !!subscriptionId,
  });
};

// Admin Hooks
export const useAllUserSubscriptions = () => {
  return useQuery({
    queryKey: ["allUserSubscriptions"],
    queryFn: () => subscriptionService.getAllUserSubscriptions(),
  });
};

export const useSubscriptionsByStatus = (status: string) => {
  return useQuery({
    queryKey: ["subscriptionsByStatus", status],
    queryFn: () => subscriptionService.getSubscriptionsByStatus(status),
    enabled: !!status,
  });
};

export const useAdminPurchaseSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdminPurchaseSubscription) => subscriptionService.adminPurchaseSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUserSubscriptions"] });
    },
  });
};

export const useUserSubscriptions = (userId: string) => {
  return useQuery({
    queryKey: ["userSubscriptions", userId],
    queryFn: () => subscriptionService.getUserSubscriptions(userId),
    enabled: !!userId,
  });
};

