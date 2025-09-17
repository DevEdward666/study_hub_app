import { z } from 'zod';
import { UserSchema } from './auth.schema';
import { CreditTransactionSchema } from './user.schema';

export const UserWithInfoSchema = UserSchema.extend({
  credits: z.number(),
  isAdmin: z.boolean(),
  hasActiveSession: z.boolean(),
});

export const TransactionWithUserSchema = CreditTransactionSchema.extend({
  user: UserSchema,
});

export const CreateTableRequestSchema = z.object({
  tableNumber: z.string(),
  hourlyRate: z.number().min(0.01, 'Hourly rate must be positive'),
  location: z.string(),
  capacity: z.number().min(1, 'Capacity must be positive'),
});

export const CreatePremiseQRRequestSchema = z.object({
  location: z.string(),
  validityHours: z.number().min(1, 'Validity hours must be positive'),
});

export type UserWithInfo = z.infer<typeof UserWithInfoSchema>;
export type TransactionWithUser = z.infer<typeof TransactionWithUserSchema>;
export type CreateTableRequest = z.infer<typeof CreateTableRequestSchema>;
export type CreatePremiseQRRequest = z.infer<typeof CreatePremiseQRRequestSchema>;
