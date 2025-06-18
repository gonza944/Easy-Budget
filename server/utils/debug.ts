// Debug utility for production troubleshooting
export function logApiCall(endpoint: string, method: string, userId?: string, startTime?: number) {
  const timestamp = new Date().toISOString();
  const duration = startTime ? `${Date.now() - startTime}ms` : 'N/A';
  
  console.log(`[API] ${timestamp} - ${method} ${endpoint} - User: ${userId || 'anonymous'} - Duration: ${duration}`);
}

export function logError(endpoint: string, error: unknown, context?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[ERROR] ${timestamp} - ${endpoint}`, {
    message: errorMessage,
    context,
    stack: process.env.NODE_ENV === 'development' ? stack : undefined
  });
}

export function logDatabaseQuery(table: string, operation: string, filters?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB] ${table}.${operation}`, filters);
  }
}

// Utility to check if we're in production
export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

// Utility to safely stringify objects for logging
export function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
} 