import { z } from "zod";
import { UserSchema } from "./auth.schema";
import { CreditTransactionSchema } from "./user.schema";

export const UserWithInfoSchema = UserSchema.extend({
  credits: z.number(),
  isAdmin: z.boolean(),
  hasActiveSession: z.boolean(),
  isApproved: z.boolean().optional(),
});

export const TransactionWithUserSchema = CreditTransactionSchema.extend({
  user: UserSchema,
});

export const CreateTableRequestSchema = z.object({
  tableNumber: z.string(),
  hourlyRate: z.number().min(0.01, "Hourly rate must be positive"),
  location: z.string(),
  capacity: z.number().min(1, "Capacity must be positive"),
});
export const UpdateTableRequestSchema = z.object({
  tableID: z.string(),
  tableNumber: z.string(),
  hourlyRate: z.number().min(0.01, "Hourly rate must be positive"),
  location: z.string(),
  capacity: z.number().min(1, "Capacity must be positive"),
});
export const SelectedTable = z.object({
  tableId: z.string(),
});
export const CreatePremiseQRRequestSchema = z.object({
  location: z.string(),
  validityHours: z.number().min(1, "Validity hours must be positive"),
});

export type UserWithInfo = z.infer<typeof UserWithInfoSchema>;
export type TransactionWithUser = z.infer<typeof TransactionWithUserSchema>;
export type CreateTableRequest = z.infer<typeof CreateTableRequestSchema>;
export type CreatePremiseQRRequest = z.infer<
  typeof CreatePremiseQRRequestSchema
>;
export const getTransactionWithUserSchema = CreditTransactionSchema.extend({
  user: UserSchema,
});
export const getTransactionWithUserTableSchema = z.object({
  data: z.array(
    CreditTransactionSchema.extend({
      user: UserSchema,
    })
  ),
});
export const getTransactionWithUserColumn = z.object({
  id: z.string(),
  user: z.string(),
  amount: z.string(),
  cost: z.string(),
  paymentMethod: z.boolean(),
  createdAt: z.number(),
  status: z.string(),
});
export type GetTransactionWithUserTableColumn = z.infer<
  typeof getTransactionWithUserColumn
>;
export type GetTransactionWithUserTableSchema = z.infer<
  typeof getTransactionWithUserTableSchema
>;
export type GetTransactionWithUserTable =
  GetTransactionWithUserTableSchema["data"][number];
export type GetTransactionWithUserTableKeys = keyof GetTransactionWithUserTable;
