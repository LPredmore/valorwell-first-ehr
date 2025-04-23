
export class APIError extends Error {
  code?: string;
  details?: any;
  retryable: boolean;
  status?: number;
  errorType: 'auth' | 'network' | 'validation' | 'server' | 'unknown';

  constructor(
    message: string, 
    code?: string, 
    details?: any, 
    retryable: boolean = true,
    status?: number,
    errorType: 'auth' | 'network' | 'validation' | 'server' | 'unknown' = 'unknown'
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.details = details;
    this.retryable = retryable;
    this.status = status;
    this.errorType = errorType;
  }
}

export const handleApiError = (error: any): never => {
  console.error('API Error:', error);
  
  // Network errors
  if (error?.message && error.message.includes('network')) {
    throw new APIError(
      'Network connection issue. Please check your internet connection.', 
      'NETWORK_ERROR',
      error,
      true, // Retryable
      undefined,
      'network'
    );
  }

  // Authentication errors
  if (error?.code === 'PGRST301' || error?.status === 401) {
    throw new APIError(
      'Authentication required. Please log in again.', 
      'AUTH_REQUIRED',
      error,
      false, // Not retryable, requires user action
      401,
      'auth'
    );
  }
  
  // Session expired
  if (error?.code === '401' || error?.message?.includes('JWT')) {
    throw new APIError(
      'Your session has expired. Please log in again.', 
      'SESSION_EXPIRED',
      error,
      false, // Not retryable, requires user action
      401,
      'auth'
    );
  }
  
  // Permission errors
  if (error?.code === 'PGRST403' || error?.status === 403) {
    throw new APIError(
      'You don\'t have permission to perform this action.', 
      'PERMISSION_DENIED',
      error,
      false, // Not retryable, requires higher permissions
      403,
      'auth'
    );
  }
  
  // Validation errors
  if (error?.code === 'PGRST400' || error?.status === 400) {
    throw new APIError(
      'Invalid input data. Please check your submission.', 
      'VALIDATION_ERROR',
      error,
      false, // Not retryable without fixing data
      400,
      'validation'
    );
  }
  
  // Resource not found
  if (error?.code === 'PGRST404' || error?.status === 404) {
    throw new APIError(
      'The requested resource was not found.', 
      'NOT_FOUND',
      error,
      false, // Not retryable
      404,
      'server'
    );
  }
  
  // Server errors
  if (error?.code?.startsWith('5') || error?.status?.toString().startsWith('5')) {
    throw new APIError(
      'A server error occurred. Please try again later.', 
      'SERVER_ERROR',
      error,
      true, // Retryable
      error?.status || 500,
      'server'
    );
  }
  
  // Foreign key constraint errors
  if (error?.code === '23503') {
    throw new APIError(
      'This operation violates database constraints. The referenced record may not exist.', 
      'FOREIGN_KEY_VIOLATION',
      error,
      false, // Not retryable without fixing data
      400,
      'validation'
    );
  }
  
  // Unique constraint errors
  if (error?.code === '23505') {
    throw new APIError(
      'A record with this information already exists.', 
      'UNIQUE_VIOLATION',
      error,
      false, // Not retryable without fixing data
      400,
      'validation'
    );
  }
  
  // Default case
  const message = error?.message || error?.error_description || 'An unknown error occurred';
  throw new APIError(message, error?.code, error?.details);
};
