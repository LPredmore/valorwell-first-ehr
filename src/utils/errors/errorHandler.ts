
/**
 * Custom error type for application errors
 */
export class AppError extends Error {
  code: string;
  context?: Record<string, any>;
  name: string;
  
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    
    // Ensures proper stack trace in modern JS environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Database error handler
 */
export const handleDatabaseError = (error: any): AppError => {
  console.error('Database error:', error);
  
  if (error?.code === '23505') {
    return new AppError(
      'This record already exists.',
      'DB_UNIQUE_VIOLATION',
      { originalError: error }
    );
  }
  
  if (error?.code === '23503') {
    return new AppError(
      'Referenced record does not exist.',
      'DB_FOREIGN_KEY_VIOLATION',
      { originalError: error }
    );
  }
  
  if (error?.code?.startsWith('22')) {
    return new AppError(
      'Invalid data format.',
      'DB_DATA_EXCEPTION',
      { originalError: error }
    );
  }
  
  return new AppError(
    error?.message || 'A database error occurred.',
    'DB_ERROR',
    { originalError: error }
  );
};

/**
 * Authentication error handler
 */
export const handleAuthError = (error: any): AppError => {
  console.error('Authentication error:', error);
  
  if (error?.message?.includes('Email not confirmed')) {
    return new AppError(
      'Please confirm your email address before signing in.',
      'AUTH_EMAIL_NOT_CONFIRMED',
      { originalError: error }
    );
  }
  
  if (error?.message?.includes('Invalid login credentials')) {
    return new AppError(
      'The email or password you entered is incorrect.',
      'AUTH_INVALID_CREDENTIALS',
      { originalError: error }
    );
  }
  
  return new AppError(
    error?.message || 'An authentication error occurred.',
    'AUTH_ERROR',
    { originalError: error }
  );
};

/**
 * General error logger and formatter
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
