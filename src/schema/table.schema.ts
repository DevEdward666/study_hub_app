import { z } from "zod";

export const CurrentSessionSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string(),
    customerName: z.string().optional().nullable(),
}).nullable().optional();

export const StudyTableSchema = z.object({
  id: z.string(),
  tableNumber: z.string(),
  qrCode: z.string(),
  qrCodeImage: z.string().nullable(),
  isOccupied: z.boolean(),
  currentUserId: z.string().nullable(),
  hourlyRate: z.number(),
  location: z.string(),
  capacity: z.number(),
  createdAt: z.string(),
  currentSession: CurrentSessionSchema,
});

export const SessionStatusSchema = z.enum(["Active", "Completed"]);

export const TableSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tableId: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  amount: z.number(),
  status: z.string(),
  paymentMethod: z.string().optional().nullable(),
  cash: z.number().optional().nullable(),
  change: z.number().optional().nullable(),
  createdAt: z.string(),
});

export const SessionWithTableSchema = TableSessionSchema.extend({
  table: StudyTableSchema,
});

export const StartSessionRequestSchema = z.object({
  tableId: z.string(),
  qrCode: z.string().optional(),
  userId: z.string().optional(),
  hours: z.number().optional(),
  endTime: z.string().optional(),
  promoId: z.string().optional(),
  amount: z.number(),
  rateId: z.string().optional(),
  paymentMethod: z.string().optional(),
  cash: z.number().optional(),
  change: z.number().optional(),
});

export const EndSessionResponseSchema = z.object({
  sessionId: z.string(),
  amount: z.number(),
  duration: z.number(),
  hours: z.number(),
  rate: z.number(),
  tableNumber: z.string(),
  customerName: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  paymentMethod: z.string().optional().nullable(),
  cash: z.number().optional().nullable(),
  change: z.number().optional().nullable(),
});

export const ChangeTableResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  newSessionId: z.string(),
});

export type StudyTable = z.infer<typeof StudyTableSchema>;
export type TableSession = z.infer<typeof TableSessionSchema>;
export type SessionWithTable = z.infer<typeof SessionWithTableSchema>;
export type StartSessionRequest = z.infer<typeof StartSessionRequestSchema>;
export type EndSessionResponse = z.infer<typeof EndSessionResponseSchema>;
export type ChangeTableResponse = z.infer<typeof ChangeTableResponseSchema>;

export const getTablesSchema = z.object({
  id: z.string(),
  tableNumber: z.string(),
  qrCode: z.string(),
  qrCodeImage: z.string().nullable(),
  isOccupied: z.boolean(),
  currentUserId: z.string().nullable(),
  hourlyRate: z.number(),
  location: z.string(),
  capacity: z.number(),
  createdAt: z.string(),
  currentSession: CurrentSessionSchema,
});
export const getTablesTableSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      tableNumber: z.string(),
      qrCode: z.string(),
      qrCodeImage: z.string().nullable(),
      isOccupied: z.boolean(),
      currentUserId: z.string().nullable(),
      hourlyRate: z.number(),
      location: z.string(),
      capacity: z.number(),
      createdAt: z.string(),
      currentSession: CurrentSessionSchema,
    })
  ),
});
export const getTablesTableColumn = z.object({
  id: z.string(),
  tableNumber: z.string(),
  qrCode: z.string(),
  qrCodeImage: z.string().nullable(),
  isOccupied: z.boolean(),
  currentUserId: z.string().nullable(),
  hourlyRate: z.number(),
  location: z.string(),
  capacity: z.number(),
  createdAt: z.string(),
  currentSession: CurrentSessionSchema,
});
export type GetTablesTableColumn = z.infer<typeof getTablesTableColumn>;
export type GetTablesTableSchema = z.infer<typeof getTablesTableSchema>;
export type GetTablesTable = GetTablesTableSchema["data"][number];
export type GetTablesTableKeys = keyof GetTablesTable;
