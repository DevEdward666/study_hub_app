import { apiClient } from "./api.client";
import {
  SubscriptionPackage,
  CreateSubscriptionPackage,
  UpdateSubscriptionPackage,
  UserSubscription,
  UserSubscriptionWithUser,
  PurchaseSubscription,
  AdminPurchaseSubscription,
  SubscriptionUsage,
  SubscriptionPackageSchema,
  UserSubscriptionSchema,
  UserSubscriptionWithUserSchema,
} from "../schema/subscription.schema";
import { ApiResponseSchema } from "../schema/api.schema";
import { z } from "zod";

class SubscriptionService {
  // Package Management
  async getAllPackages(): Promise<SubscriptionPackage[]> {
    return await apiClient.get<SubscriptionPackage[]>(
      "/subscriptions/packages",
      ApiResponseSchema(z.array(SubscriptionPackageSchema))
    );
  }

  async getActivePackages(): Promise<SubscriptionPackage[]> {
    return await apiClient.get<SubscriptionPackage[]>(
      "/subscriptions/packages?activeOnly=true",
      ApiResponseSchema(z.array(SubscriptionPackageSchema))
    );
  }

  async getPackageById(packageId: string): Promise<SubscriptionPackage> {
    return await apiClient.get<SubscriptionPackage>(
      `/subscriptions/packages/${packageId}`,
      ApiResponseSchema(SubscriptionPackageSchema)
    );
  }

  async createPackage(data: CreateSubscriptionPackage): Promise<SubscriptionPackage> {
    return await apiClient.post<SubscriptionPackage>(
      "/subscriptions/packages",
      ApiResponseSchema(SubscriptionPackageSchema),
      data
    );
  }

  async updatePackage(packageId: string, data: UpdateSubscriptionPackage): Promise<SubscriptionPackage> {
    return await apiClient.put<SubscriptionPackage>(
      `/subscriptions/packages/${packageId}`,
      ApiResponseSchema(SubscriptionPackageSchema),
      data
    );
  }

  async deletePackage(packageId: string): Promise<boolean> {
    return await apiClient.delete<boolean>(
      `/subscriptions/packages/${packageId}`,
      ApiResponseSchema(z.boolean())
    );
  }

  // User Subscription Management
  async getMySubscriptions(activeOnly: boolean = false): Promise<UserSubscription[]> {
    const url = activeOnly ? "/subscriptions/my-subscriptions?activeOnly=true" : "/subscriptions/my-subscriptions";
    return await apiClient.get<UserSubscription[]>(
      url,
      ApiResponseSchema(z.array(UserSubscriptionSchema))
    );
  }

  async getSubscriptionById(subscriptionId: string): Promise<UserSubscription> {
    return await apiClient.get<UserSubscription>(
      `/subscriptions/${subscriptionId}`,
      ApiResponseSchema(UserSubscriptionSchema)
    );
  }

  async purchaseSubscription(data: PurchaseSubscription): Promise<UserSubscription> {
    return await apiClient.post<UserSubscription>(
      "/subscriptions/purchase",
      ApiResponseSchema(UserSubscriptionSchema),
      data
    );
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    return await apiClient.post<boolean>(
      `/subscriptions/${subscriptionId}/cancel`,
      ApiResponseSchema(z.boolean()),
      {}
    );
  }

  async getSubscriptionUsage(subscriptionId: string): Promise<SubscriptionUsage> {
    return await apiClient.get<SubscriptionUsage>(
      `/subscriptions/${subscriptionId}/usage`,
      ApiResponseSchema(z.any())
    );
  }

  // Admin Functions
  async getAllUserSubscriptions(): Promise<UserSubscriptionWithUser[]> {
    return await apiClient.get<UserSubscriptionWithUser[]>(
      "/subscriptions/admin/all",
      ApiResponseSchema(z.array(UserSubscriptionWithUserSchema))
    );
  }

  async getSubscriptionsByStatus(status: string): Promise<UserSubscriptionWithUser[]> {
    return await apiClient.get<UserSubscriptionWithUser[]>(
      `/subscriptions/admin/status/${status}`,
      ApiResponseSchema(z.array(UserSubscriptionWithUserSchema))
    );
  }

  async adminPurchaseSubscription(data: AdminPurchaseSubscription): Promise<UserSubscription> {
    return await apiClient.post<UserSubscription>(
      "/subscriptions/admin/purchase",
      ApiResponseSchema(UserSubscriptionSchema),
      data
    );
  }

  async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    return await apiClient.get<UserSubscription[]>(
      `/subscriptions/admin/user/${userId}`,
      ApiResponseSchema(z.array(UserSubscriptionSchema))
    );
  }
}

const subscriptionService = new SubscriptionService();
export default subscriptionService;

