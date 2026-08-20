/**
 * Centralized error handling for the frontend.
 * Replaces scattered console.error calls with a consistent approach.
 */

type ErrorContext = {
  component?: string;
  action?: string;
  severity?: 'low' | 'medium' | 'high';
};

/**
 * Log an error in development only. In production, errors are sent to Sentry
 * via the global error boundary and unhandledrejection handler.
 */
export function logError(
  error: unknown,
  context: ErrorContext = {},
): void {
  if (process.env.NODE_ENV !== 'production') {
    const prefix = context.component ? `[${context.component}]` : '';
    const action = context.action ? ` during ${context.action}` : '';
    console.error(`${prefix}${action}`, error);
  }
}

/**
 * Create an ErrorBoundary-compatible error handler.
 */
export function handleErrorBoundary(error: Error, errorInfo: { componentStack?: string }): void {
  logError(error, { component: 'ErrorBoundary', severity: 'high' });
  if (process.env.NODE_ENV !== 'production' && errorInfo.componentStack) {
    console.error('Component stack:', errorInfo.componentStack);
  }
}
