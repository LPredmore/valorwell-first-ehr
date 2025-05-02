
import { AppError } from './AppError';

/**
 * Validation error - used when input data fails validation
 */
export class ValidationError extends AppError {
  constructor(message: string, options: any = {}) {
    super(message, 'VALIDATION_ERROR', {
      statusCode: 400,
      userVisible: true,
      userMessage: options.userMessage || message,
      ...options
    });
  }
}

/**
 * Authentication error - used for login/authentication issues
 */
export class AuthenticationError extends AppError {
  constructor(message: string, options: any = {}) {
    super(message, options.code || 'AUTHENTICATION_ERROR', {
      statusCode: 401,
      userVisible: true,
      userMessage: options.userMessage || 'Authentication error. Please sign in again.',
      ...options
    });
  }
}

/**
 * Permission error - used when a user lacks required permissions
 */
export class PermissionError extends AppError {
  constructor(message: string, options: any = {}) {
    super(message, 'PERMISSION_ERROR', {
      statusCode: 403,
      userVisible: true,
      userMessage: options.userMessage || 'You do not have permission to perform this action.',
      ...options
    });
  }
}

/**
 * Not found error - used when a resource cannot be found
 */
export class NotFoundError extends AppError {
  constructor(message: string, options: any = {}) {
    super(message, 'NOT_FOUND', {
      statusCode: 404,
      userVisible: true,
      userMessage: options.userMessage || 'The requested resource could not be found.',
      ...options
    });
  }
}

/**
 * Network error - used for communication/fetch failures
 */
export class NetworkError extends AppError {
  url?: string;
  status?: number;
  
  constructor(message: string, options: any = {}) {
    super(message, options.code || 'NETWORK_ERROR', {
      statusCode: options.status || 0,
      userVisible: true,
      userMessage: options.userMessage || 'Network error. Please check your connection and try again.',
      ...options
    });
    
    this.url = options.url;
    this.status = options.status;
  }
}

/**
 * Database error - used for database operation failures
 */
export class DatabaseError extends AppError {
  table?: string;
  operation?: string;
  
  constructor(message: string, options: any = {}) {
    super(message, options.code || 'DATABASE_ERROR', {
      statusCode: 500,
      userVisible: options.userMessage !== undefined,
      userMessage: options.userMessage || 'A database error occurred. Please try again later.',
      ...options
    });
    
    this.table = options.table;
    this.operation = options.operation;
  }
}

/**
 * Integration error - used for third-party service failures
 */
export class IntegrationError extends AppError {
  service?: string;
  
  constructor(message: string, options: any = {}) {
    super(message, options.code || 'INTEGRATION_ERROR', {
      statusCode: 502,
      userVisible: options.userMessage !== undefined,
      userMessage: options.userMessage || 'An external service error occurred. Please try again later.',
      ...options
    });
    
    this.service = options.service;
  }
}

/**
 * Timeout error - used when operations time out
 */
export class TimeoutError extends AppError {
  timeoutMs?: number;
  
  constructor(message: string, options: any = {}) {
    super(message, 'TIMEOUT', {
      statusCode: 504,
      userVisible: true,
      userMessage: options.userMessage || 'The operation timed out. Please try again later.',
      ...options
    });
    
    this.timeoutMs = options.timeoutMs;
  }
}

/**
 * Conflict error - used for resource conflicts
 */
export class ConflictError extends AppError {
  constructor(message: string, options: any = {}) {
    super(message, 'CONFLICT', {
      statusCode: 409,
      userVisible: true,
      userMessage: options.userMessage || 'This operation conflicts with existing data.',
      ...options
    });
  }
}

/**
 * Calendar error - used for calendar-specific issues
 */
export class CalendarError extends AppError {
  constructor(message: string, options: any = {}) {
    super(message, options.code || 'CALENDAR_ERROR', {
      statusCode: 400,
      userVisible: true,
      userMessage: options.userMessage || message,
      ...options
    });
  }
}

/**
 * TimeZone error - used for timezone-related issues
 */
export class TimeZoneError extends AppError {
  constructor(message: string, options: any = {}) {
    super(message, options.code || 'TIMEZONE_ERROR', {
      statusCode: 400,
      userVisible: true,
      userMessage: options.userMessage || 'Invalid or unsupported timezone.',
      ...options
    });
  }
}
