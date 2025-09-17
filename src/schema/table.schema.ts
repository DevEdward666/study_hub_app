import { z } from 'zod';

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
});

export const SessionStatusSchema = z.enum(['Active', 'Completed']);

export const TableSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tableId: z.string(),
  startTime: z.string(),
  endTime: z.string().nullable(),
  creditsUsed: z.number(),
  status: SessionStatusSchema,
  createdAt: z.string(),
});

export const SessionWithTableSchema = TableSessionSchema.extend({
  table: StudyTableSchema,
});

export const StartSessionRequestSchema = z.object({
  tableId: z.string(),
  qrCode: z.string(),
});

export const EndSessionResponseSchema = z.object({
  creditsUsed: z.number(),
  duration: z.number(),
});

export type StudyTable = z.infer<typeof StudyTableSchema>;
export type TableSession = z.infer<typeof TableSessionSchema>;
export type SessionWithTable = z.infer<typeof SessionWithTableSchema>;
export type StartSessionRequest = z.infer<typeof StartSessionRequestSchema>;
export type EndSessionResponse = z.infer<typeof EndSessionResponseSchema>;
