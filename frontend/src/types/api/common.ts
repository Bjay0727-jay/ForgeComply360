// Common API response schemas
import { z } from 'zod';

// Pagination schema for list responses
export const PaginationSchema = z.object({
  total: z.number().default(0),
  page: z.number().default(1),
  limit: z.number().default(50),
});

export type Pagination = z.infer<typeof PaginationSchema>;

// Helper to create paginated list schemas
export function createListResponseSchema<T extends z.ZodTypeAny>(
  itemSchema: T,
  itemsKey: string
) {
  return z.object({
    [itemsKey]: z.array(itemSchema).default([]),
    total: z.number().optional().default(0),
    page: z.number().optional().default(1),
    limit: z.number().optional().default(50),
  });
}

// Common nullable string (coerces null/undefined to null)
export const nullableString = z.string().nullable().default(null);

// Common nullable number (coerces null/undefined to null)
export const nullableNumber = z.number().nullable().default(null);

// Timestamp string (ISO format)
export const timestampString = z.string().datetime().optional();
