import { z } from "zod";

export const RateSchema = z.object({
  id: z.string().uuid(),
  hours: z.number(),
  durationType: z.string().default("Hourly"), // Hourly, Daily, Weekly, Monthly
  durationValue: z.number().default(1),
  price: z.number(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  displayOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateRateRequestSchema = z.object({
  hours: z.number().min(1).max(8760),
  durationType: z.string().default("Hourly"),
  durationValue: z.number().min(1).max(365).default(1),
  price: z.number().min(0.01),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().optional(),
});

export const UpdateRateRequestSchema = z.object({
  id: z.string().uuid(),
  hours: z.number().min(1).max(8760),
  durationType: z.string(),
  durationValue: z.number().min(1).max(365),
  price: z.number().min(0.01),
  description: z.string().optional(),
  isActive: z.boolean(),
  displayOrder: z.number(),
});

export type Rate = z.infer<typeof RateSchema>;
export type CreateRateRequest = z.infer<typeof CreateRateRequestSchema>;
export type UpdateRateRequest = z.infer<typeof UpdateRateRequestSchema>;

