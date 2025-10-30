import { z } from "zod";
import { UserSchema } from "./auth.schema";
import { CreditTransactionSchema } from "./user.schema";
import { StudyTableSchema, TableSessionSchema } from "./table.schema";

export const UserWithInfoSchema = UserSchema.extend({
  isAdmin: z.boolean(),
  hasActiveSession: z.boolean(),
});

export const CreateUserRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["Staff", "Admin", "Super Admin"]),
  password: z.string().optional(),
});

export const CreateUserResponseSchema = z.object({
  userId: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
});

export const UpdateUserRequestSchema = z.object({
  userId: z.string(),
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["Staff", "Admin", "Super Admin"]),
  phone: z.string().optional(),
});

export const UpdateUserResponseSchema = z.object({
  userId: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
  phone: z.string().optional(),
});

export const TransactionWithUserSchema = z.object({
  user: UserSchema.optional().nullable(),
  tables:StudyTableSchema.optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  cost: z.number(),
  status: z.string(),
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
export const getTransactionWithUserSchema = z.object({
  session: TableSessionSchema.optional().nullable(),
  user: UserSchema.optional().nullable(),
  tables:StudyTableSchema.optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  cost: z.number(),
  status: z.string(),
});
export const getTransactionWithUserTableSchema = z.object({
  data: z.array(
    z.object({
      user: UserSchema.optional().nullable(),
      tables: StudyTableSchema.optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  cost: z.number(),
  status: z.string(),
    })
  ),
});
export const getTransactionWithUserColumn = z.object({
  id: z.string(),
  user: z.string(),
  tables: StudyTableSchema.optional().nullable(),
  cost: z.number(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  paymentMethod: z.string().optional().nullable(),
  cash: z.number().optional().nullable(),
  change: z.number().optional().nullable(),
  status: z.string(),
  createdAt: z.string(),
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
