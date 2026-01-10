/**
 * Safely convert an unknown error to a string message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

/**
 * Type guard to check if a value is an Error object
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Format an error for logging output
 */
export function formatErrorForLog(error: unknown, context?: string): string {
  const message = getErrorMessage(error);
  const prefix = context ? `[${context}] ` : '';
  return `${prefix}${message}`;
}
