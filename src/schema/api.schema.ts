import { z } from 'zod';

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.nullable(),
    message: z.string().nullable(),
    errors: z.array(z.string()).nullable(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  message: string | null;
  errors: string[] | null;
};