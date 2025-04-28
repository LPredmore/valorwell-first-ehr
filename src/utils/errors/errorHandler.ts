import { 
  AppError, 
} from './AppError';
import {
  ValidationError,
  PermissionError,
  NotFoundError,
  NetworkError,
  DatabaseError,
  AuthenticationError,
  IntegrationError,
  TimeoutError,
  ConflictError,
  CalendarError,
  TimeZoneError
} from './ErrorTypes';

// Type for error logging function
type ErrorLogger = (error: Error | AppError, context?: Record<string, any>) => void;

// Default error logger that logs to console
const defaultErrorLogger: ErrorLogger = (error, context) => {
  if (error instanceof AppError) {
    console.error(`[${error.code}] ${error.message}`, {
      ...error.toJSON(),
      ...context
    });
  } else {
    console.error(`[UNKNOWN_ERROR] ${error.message}`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context
    });
  }
};

// Global error logger that can be customized
let globalErrorLogger: ErrorLogger = defaultErrorLogger;

/**
 * Set a custom error logger for the application
 */
export const setErrorLogger = (logger: ErrorLogger): void => {
  globalErrorLogger = logger;
};

/**
 * Log an error using the configured error logger
 */
export const logError = (error: Error | AppError, context?: Record<string, any>): void => {
  globalErrorLogger(error, context);
};

/**
 * Format an error for display to the user
 */
export const formatErrorForUser = (error: unknown): { message: string; code: string } => {
  if (error instanceof AppError && error.userVisible) {
    return {
      message: error.getUserMessage(),
      code: error.code
    };
  }
  
  // Default generic error message for non-user-visible errors
  return {
    message: 'An unexpected error occurred. Please try again later.',
    code: 'UNKNOWN_ERROR'
  };
};

/**
 * Handle and transform database errors
 */
export const handleDatabaseError = (error: any, operation?: string, table?: string): DatabaseError => {
  // Log the original error
  logError(error, { source: 'database', operation, table });
  
  // If it's already a DatabaseError, return it
  if (error instanceof DatabaseError) {
    return error;
  }
  
  // Handle Supabase/PostgreSQL specific error codes
  if (error?.code === '23505') {
    return new DatabaseError(
      'This record already exists.',
      {
        code: 'DB_UNIQUE_VIOLATION',
        operation,
        table,
        context: { originalError: error },
        userMessage: 'A record with this information already exists.'
      }
    );
  }
  
  if (error?.code === '23503') {
    return new DatabaseError(
      'Referenced record does not exist.',
      {
        code: 'DB_FOREIGN_KEY_VIOLATION',
        operation,
        table,
        context: { originalError: error },
        userMessage: 'The referenced record does not exist.'
      }
    );
  }
  
  if (error?.code?.startsWith('22')) {
    return new DatabaseError(
      'Invalid data format.',
      {
        code: 'DB_DATA_EXCEPTION',
        operation,
        table,
        context: { originalError: error },
        userMessage: 'The data format is invalid.'
      }
    );
  }
  
  if (error?.code?.startsWith('42')) {
    return new DatabaseError(
      'Database syntax or configuration error.',
      {
        code: 'DB_SYNTAX_ERROR',
        operation,
        table,
        context: { originalError: error }
      }
    );
  }
  
  // Generic database error
  return new DatabaseError(
    error?.message || 'A database error occurred.',
    {
      operation,
      table,
      context: { originalError: error }
    }
  );
};

/**
 * Handle and transform authentication errors
 */
export const handleAuthError = (error: any): AuthenticationError => {
  // Log the original error
  logError(error, { source: 'authentication' });
  
  // If it's already an AuthenticationError, return it
  if (error instanceof AuthenticationError) {
    return error;
  }
  
  // Handle specific authentication error messages
  if (error?.message?.includes('Email not confirmed')) {
    return new AuthenticationError(
      'Please confirm your email address before signing in.',
      {
        code: 'AUTH_EMAIL_NOT_CONFIRMED',
        context: { originalError: error },
        userMessage: 'Please confirm your email address before signing in.'
      }
    );
  }
  
  if (error?.message?.includes('Invalid login credentials')) {
    return new AuthenticationError(
      'The email or password you entered is incorrect.',
      {
        code: 'AUTH_INVALID_CREDENTIALS',
        context: { originalError: error },
        userMessage: 'The email or password you entered is incorrect.'
      }
    );
  }
  
  if (error?.message?.includes('User not found')) {
    return new AuthenticationError(
      'User not found.',
      {
        code: 'AUTH_USER_NOT_FOUND',
        context: { originalError: error },
        userMessage: 'No account was found with these credentials.'
      }
    );
  }
  
  // Generic authentication error
  return new AuthenticationError(
    error?.message || 'An authentication error occurred.',
    {
      context: { originalError: error }
    }
  );
};

/**
 * Handle and transform network errors
 */
export const handleNetworkError = (error: any, url?: string): NetworkError => {
  // Log the original error
  logError(error, { source: 'network', url });
  
  // If it's already a NetworkError, return it
  if (error instanceof NetworkError) {
    return error;
  }
  
  // Extract status code if available
  const status = error?.status || error?.statusCode || error?.response?.status;
  
  // Create appropriate network error
  return new NetworkError(
    error?.message || 'A network error occurred.',
    {
      url,
      status,
      context: { originalError: error }
    }
  );
};

/**
 * Handle and transform API errors
 */
export const handleApiError = (error: any): AppError => {
  // Log the original error
  logError(error, { source: 'api' });
  
  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }
  
  // Extract status code if available
  const status = error?.status || error?.statusCode || error?.response?.status;
  
  // Handle based on status code
  if (status === 400) {
    return new ValidationError(
      error?.message || 'Invalid request data.',
      {
        context: { originalError: error }
      }
    );
  }
  
  if (status === 401) {
    return new AuthenticationError(
      error?.message || 'Authentication required.',
      {
        context: { originalError: error }
      }
    );
  }
  
  if (status === 403) {
    return new PermissionError(
      error?.message || 'Permission denied.',
      {
        context: { originalError: error }
      }
    );
  }
  
  if (status === 404) {
    return new NotFoundError(
      error?.message || 'Resource not found.',
      {
        context: { originalError: error }
      }
    );
  }
  
  if (status === 409) {
    return new ConflictError(
      error?.message || 'Resource conflict.',
      {
        context: { originalError: error }
      }
    );
  }
  
  if (status === 429) {
    return new AppError(
      error?.message || 'Too many requests.',
      'RATE_LIMIT_EXCEEDED',
      {
        statusCode: 429,
        context: { originalError: error },
        userVisible: true,
        userMessage: 'Too many requests. Please try again later.'
      }
    );
  }
  
  if (status >= 500) {
    return new AppError(
      error?.message || 'Server error.',
      'SERVER_ERROR',
      {
        statusCode: status,
        context: { originalError: error }
      }
    );
  }
  
  // Generic error
  return new AppError(
    error?.message || 'An unexpected error occurred.',
    'UNKNOWN_ERROR',
    {
      context: { originalError: error }
    }
  );
};

/**
 * Handle and transform calendar-specific errors
 */
export const handleCalendarError = (error: any): CalendarError => {
  // Log the original error
  logError(error, { source: 'calendar' });
  
  // If it's already a CalendarError, return it
  if (error instanceof CalendarError) {
    return error;
  }
  
  // Handle timezone-specific errors
  if (error instanceof TimeZoneError || error?.name === 'TimeZoneError') {
    return new CalendarError(
      error.message,
      {
        code: 'CALENDAR_TIMEZONE_ERROR',
        context: { originalError: error },
        userMessage: 'There was an issue with the timezone settings. Please check your timezone configuration.'
      }
    );
  }
  
  // Handle specific calendar error messages
  if (error?.message?.includes('overlap')) {
    return new CalendarError(
      error.message,
      {
        code: 'CALENDAR_OVERLAP_ERROR',
        context: { originalError: error },
        userMessage: 'This time slot overlaps with an existing event. Please choose a different time.'
      }
    );
  }
  
  if (error?.message?.includes('permission')) {
    return new CalendarError(
      error.message,
      {
        code: 'CALENDAR_PERMISSION_ERROR',
        context: { originalError: error },
        userMessage: 'You do not have permission to perform this calendar operation.'
      }
    );
  }
  
  // Generic calendar error
  return new CalendarError(
    error?.message || 'A calendar error occurred.',
    {
      context: { originalError: error }
    }
  );
};

/**
 * Safely execute a function and handle any errors
 * @param fn The function to execute
 * @param errorHandler Optional custom error handler
 * @returns A promise that resolves to the function result or rejects with a handled error
 */
export const tryCatch = async <T>(
  fn: () => Promise<T>,
  errorHandler?: (error: any) => AppError
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (errorHandler) {
      throw errorHandler(error);
    }
    
    // Default error handling based on error type
    if (error instanceof AppError) {
      throw error;
    }
    
    throw handleApiError(error);
  }
};

/**
 * General error logger and formatter
 * @deprecated Use formatErrorForUser and logError instead
 */
export const logAndFormatError = (
  error: any,
  defaultMessage: string = 'An unexpected error occurred'
): { message: string; code: string } => {
  console.error('Application error:', error);
  
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code
    };
  }
  
  return {
    message: error?.message || defaultMessage,
    code: 'UNKNOWN_ERROR'
  };
};

// Re-export the AppError class for backward compatibility
export { AppError };
