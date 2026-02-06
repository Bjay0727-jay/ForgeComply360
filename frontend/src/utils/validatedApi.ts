// Validated API wrapper with Zod schema validation
import { z, ZodSchema, ZodError } from 'zod';
import { api, onApiError } from './api';

/**
 * Custom error class for API validation failures
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public path: string,
    public issues: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Type-safe API call with Zod validation and automatic defaults.
 *
 * This wrapper:
 * 1. Makes the API call using the existing api() function
 * 2. Validates the response against the provided Zod schema
 * 3. Returns validated data with defaults applied for missing fields
 * 4. Logs warnings for validation issues but tries to recover gracefully
 *
 * @param path - API endpoint path
 * @param schema - Zod schema to validate response against
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Validated and typed response data
 *
 * @example
 * ```typescript
 * const stats = await validatedApi(
 *   '/api/v1/dashboard/stats',
 *   DashboardStatsResponseSchema
 * );
 * // stats.compliance_percentage is guaranteed to be a number (default 0)
 * ```
 */
export async function validatedApi<T>(
  path: string,
  schema: ZodSchema<T>,
  options: RequestInit = {}
): Promise<T> {
  // Make the API call
  const rawResponse = await api<unknown>(path, options);

  // Attempt to parse/validate the response
  const result = schema.safeParse(rawResponse);

  if (result.success) {
    return result.data;
  }

  // Validation failed - log warning with details
  console.warn(
    `[validatedApi] Validation warning for ${path}:`,
    result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
  );

  // Try to recover by parsing with an empty object (applies all defaults)
  // This handles cases where the response is completely malformed
  try {
    const defaulted = schema.parse(rawResponse ?? {});
    return defaulted;
  } catch (parseError) {
    // If we still can't parse, try with empty object to get defaults
    try {
      const emptyDefaults = schema.parse({});
      console.warn(`[validatedApi] Using schema defaults for ${path}`);
      return emptyDefaults;
    } catch {
      // Schema doesn't support empty defaults - throw original error
      throw new ValidationError(
        `Invalid API response from ${path}: ${result.error.message}`,
        path,
        result.error.issues
      );
    }
  }
}

/**
 * Validated API call that extracts a nested property from the response.
 * Useful for API responses wrapped in a container object.
 *
 * @param path - API endpoint path
 * @param schema - Zod schema for the wrapper object
 * @param extractKey - Key to extract from the response
 * @param options - Fetch options
 *
 * @example
 * ```typescript
 * const stats = await validatedApiExtract(
 *   '/api/v1/dashboard/stats',
 *   z.object({ stats: DashboardStatsSchema }),
 *   'stats'
 * );
 * ```
 */
export async function validatedApiExtract<T, K extends keyof T>(
  path: string,
  schema: ZodSchema<T>,
  extractKey: K,
  options: RequestInit = {}
): Promise<T[K]> {
  const response = await validatedApi(path, schema, options);
  return response[extractKey];
}

/**
 * Check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
