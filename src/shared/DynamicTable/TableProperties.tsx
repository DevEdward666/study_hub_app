import { z } from "zod";

export const tableColumns = z.object({
  key: z.string(),
  label: z.string(),
  sortable: z.boolean().optional(),
  visible: z.boolean().optional(),
  order: z.number().optional(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    data: z
      .union([z.array(itemSchema), itemSchema])
      .transform((val) => (Array.isArray(val) ? val : [val])),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
  });

export type PaginatedResponse<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof PaginatedResponseSchema<T>>
>;
export type TableColumns = z.infer<typeof tableColumns>;
