import { z } from 'zod';
import { TableSessionSchema, StudyTableSchema } from './table.schema';

export const UserCreditsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  balance: z.number(),
  totalPurchased: z.number(),
  totalSpent: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TransactionStatusSchema = z.enum(['Pending', 'Approved', 'Rejected']);

export const CreditTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number(),
  cost: z.number(),
  status: TransactionStatusSchema,
  paymentMethod: z.string(),
  transactionId: z.string(),
  approvedBy: z.string().nullable(),
  approvedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const PurchaseCreditsRequestSchema = z.object({
  amount: z.number().min(1, 'Amount must be positive'),
  paymentMethod: z.string(),
  transactionId: z.string(),
});

export const SessionWithTableSchema = TableSessionSchema.extend({
  table: StudyTableSchema,
});

export type UserCredits = z.infer<typeof UserCreditsSchema>;
export type CreditTransaction = z.infer<typeof CreditTransactionSchema>;
export type PurchaseCreditsRequest = z.infer<typeof PurchaseCreditsRequestSchema>;
export type SessionWithTable = z.infer<typeof SessionWithTableSchema>;
