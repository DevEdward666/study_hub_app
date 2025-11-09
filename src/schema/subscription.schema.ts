import { z } from "zod";

// Subscription Package Schema
export const SubscriptionPackageSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  packageType: z.string(), // Hourly, Daily, Weekly, Monthly
  durationValue: z.number(),
  totalHours: z.number(),
  price: z.number(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  displayOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateSubscriptionPackageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  packageType: z.string().min(1, "Package type is required"),
  durationValue: z.number().min(1).max(365),
  totalHours: z.number().min(1).max(8760),
  price: z.number().min(0.01),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
});

export const UpdateSubscriptionPackageSchema = z.object({
  name: z.string().optional(),
  price: z.number().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().optional(),
});

// User Subscription Schema
export const UserSubscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  packageId: z.string().uuid(),
  packageName: z.string(),
  packageType: z.string(),
  totalHours: z.number(),
  remainingHours: z.number(),
  hoursUsed: z.number(),
  percentageUsed: z.number(),
  purchaseDate: z.string(),
  activationDate: z.string().nullable(),
  expiryDate: z.string().nullable(),
  status: z.string(),
  purchaseAmount: z.number(),
  paymentMethod: z.string().nullable(),
  transactionReference: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdByName: z.string().nullable(),
});

export const UserSubscriptionWithUserSchema = UserSubscriptionSchema.extend({
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    role: z.string(),
    emailVerified: z.boolean(),
    image: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).nullable(),
});

export const PurchaseSubscriptionSchema = z.object({
  packageId: z.string().uuid(),
  paymentMethod: z.string(),
  cash: z.number().optional(),
  change: z.number().optional(),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});

export const AdminPurchaseSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  packageId: z.string().uuid(),
  paymentMethod: z.string(),
  cash: z.number().optional(),
  change: z.number().optional(),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});

export const StartSubscriptionSessionSchema = z.object({
  tableId: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  userId: z.string().uuid().optional(),
});

export const SubscriptionUsageSchema = z.object({
  subscriptionId: z.string().uuid(),
  hoursConsumed: z.number(),
  remainingHours: z.number(),
  sessionStartTime: z.string(),
  sessionEndTime: z.string().nullable(),
});

// Types
export type SubscriptionPackage = z.infer<typeof SubscriptionPackageSchema>;
export type CreateSubscriptionPackage = z.infer<typeof CreateSubscriptionPackageSchema>;
export type UpdateSubscriptionPackage = z.infer<typeof UpdateSubscriptionPackageSchema>;
export type UserSubscription = z.infer<typeof UserSubscriptionSchema>;
export type UserSubscriptionWithUser = z.infer<typeof UserSubscriptionWithUserSchema>;
export type PurchaseSubscription = z.infer<typeof PurchaseSubscriptionSchema>;
export type AdminPurchaseSubscription = z.infer<typeof AdminPurchaseSubscriptionSchema>;
export type StartSubscriptionSession = z.infer<typeof StartSubscriptionSessionSchema>;
export type SubscriptionUsage = z.infer<typeof SubscriptionUsageSchema>;

