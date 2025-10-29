import { z } from "zod";

export const CurrentSessionSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string(),
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
  tableId: z.string(),
  startTime: z.string(),
  endTime: z.string().nullable(),
  amount: z.number(),
  status: z.string(),
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
});

export const EndSessionResponseSchema = z.object({
  amount: z.number(),
  duration: z.number(),
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
