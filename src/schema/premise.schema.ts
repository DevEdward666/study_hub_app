import { z } from "zod";

export const PremiseQrCodeSchema = z.object({
  id: z.string(),
  code: z.string(),
  location: z.string(),
  isActive: z.boolean(),
  validityHours: z.number(),
  createdAt: z.string(),
});

export const ActivePremiseAccessSchema = z.object({
  id: z.string(),
  userId: z.string(),
  activatedAt: z.string(),
  expiresAt: z.string(),
  isActive: z.boolean(),
  activationCode: z.string(),
  location: z.string().nullable(),
  timeRemaining: z.number(),
});

export const ActivatePremiseRequestSchema = z.object({
  activationCode: z.string(),
});

export const PremiseAccessSchema = z.object({
  success: z.boolean(),
  expiresAt: z.string(),
  location: z.string(),
  validityHours: z.number(),
});

export type PremiseQrCode = z.infer<typeof PremiseQrCodeSchema>;
export type ActivePremiseAccess = z.infer<typeof ActivePremiseAccessSchema>;
export type ActivatePremiseRequest = z.infer<
  typeof ActivatePremiseRequestSchema
>;
export type PremiseAccess = z.infer<typeof PremiseAccessSchema>;

export const getPremiseSchema = z.object({
  id: z.string(),
  code: z.string(),
  location: z.string(),
  isActive: z.boolean(),
  validityHours: z.number(),
  createdAt: z.string(),
});
export const getPremiseTableSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      location: z.string(),
      isActive: z.boolean(),
      validityHours: z.number(),
      createdAt: z.string(),
    })
  ),
});
export const getPremiseTableColumn = z.object({
  id: z.string(),
  code: z.string(),
  location: z.string(),
  isActive: z.boolean(),
  validityHours: z.number(),
  createdAt: z.string(),
});
export type GetPremiseTableColumn = z.infer<typeof getPremiseTableColumn>;
export type GetPremiseTableSchema = z.infer<typeof getPremiseTableSchema>;
export type GetPremiseTable = GetPremiseTableSchema["data"][number];
export type GetPremiseTableKeys = keyof GetPremiseTable;
