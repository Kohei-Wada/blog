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
 * Format an error for logging output
 */
export function formatErrorForLog(error: unknown, context?: string): string {
  const message = getErrorMessage(error);
  const prefix = context ? `[${context}] ` : '';
  return `${prefix}${message}`;
}
