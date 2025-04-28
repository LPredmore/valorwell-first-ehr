import { AppError } from './AppError';

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    options: {
      context?: Record<string, any>;
      userMessage?: string;
      field?: string;
      value?: any;
      cause?: Error;
    } = {}
  ) {
    super(message, 'VALIDATION_ERROR', {
      ...options,
      statusCode: 400,
      userVisible: true,
      userMessage: options.userMessage || 'The provided data is invalid.',
      context: {
        ...options.context,
        field: options.field,
        value: options.value
      }
    });
  }

  /**
   * Create a validation error for a specific field
   */
  static forField(
    field: string,
    message: string,
    value?: any,
    userMessage?: string
  ): ValidationError {
    return new ValidationError(message, {
      field,
      value,
      userMessage
    });
  }
}

/**
 * Error thrown when a user doesn't have permission to perform an action
 */
export class PermissionError extends AppError {
  constructor(
    message: string,
    options: {
      context?: Record<string, any>;
      userMessage?: string;
      resource?: string;
      action?: string;
      cause?: Error;
    } = {}
  ) {
    super(message, 'PERMISSION_DENIED', {
      ...options,
      statusCode: 403,
      userVisible: true,
      userMessage: options.userMessage || 'You do not have permission to perform this action.',
      context: {
        ...options.context,
        resource: options.resource,
        action: options.action
      }
    });
  }
}

/**
 * Error thrown when a requested resource is not found
 */
export class NotFoundError extends AppError {
  constructor(
    message: string,
    options: {
      context?: Record<string, any>;
      userMessage?: string;
      resource?: string;
      identifier?: string | number;
      cause?: Error;
    } = {}
  ) {
    super(message, 'NOT_FOUND', {
      ...options,
      statusCode: 404,
      userVisible: true,
      userMessage: options.userMessage || 'The requested resource was not found.',
      context: {
        ...options.context,
        resource: options.resource,
        identifier: options.identifier
      }
    });
  }

  /**
   * Create a not found error for a specific resource type
   */
  static forResource(
    resourceType: string,
    identifier?: string | number,
    userMessage?: string
  ): NotFoundError {
    return new NotFoundError(
      `${resourceType} not found${identifier ? ` with identifier: ${identifier}` : ''}`,
      {
        resource: resourceType,
        identifier,
        userMessage
      }
    );
  }
}

/**
 * Error thrown when there's a network-related issue
 */
export class NetworkError extends AppError {
  constructor(
    message: string,
    options: {
      context?: Record<string, any>;
      userMessage?: string;
      url?: string;
      status?: number;
      cause?: Error;
    } = {}
  ) {
    super(message, 'NETWORK_ERROR', {
      ...options,
      statusCode: options.status || 500,
      userVisible: true,
      userMessage: options.userMessage || 'A network error occurred. Please check your connection and try again.',
      context: {
        ...options.context,
        url: options.url,
        status: options.status
      }
    });
  }
}

/**
 * Error thrown when there's a database-related issue
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    options: {
      context?: Record<string, any>;
      userMessage?: string;
      operation?: string;
      table?: string;
      code?: string;
      cause?: Error;
    } = {}
  ) {
    super(message, options.code || 'DATABASE_ERROR', {
      ...options,
      statusCode: 500,
      userVisible: false,
      userMessage: options.userMessage || 'An error occurred while accessing the database.',
      context: {
        ...options.context,
        operation: options.operation,
        table: options.table
      }
    });
  }
}

/**
 * Error thrown when there's an authentication-related issue
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string,
    options: {
      context?: Record<string, any>;
      userMessage?: string;
      code?: string;
      cause?: Error;
    } = {}
  ) {
    super(message, options.code || 'AUTHENTICATION_ERROR', {
      ...options,
      statusCode: 401,
      userVisible: true,
      userMessage: options.userMessage || 'Authentication failed. Please check your credentials and try again.'
    });
  }
}

/**
 * Error thrown when there's an issue with external service integration
 */
export class IntegrationError extends AppError {
  constructor(
    message: string,
    options: {
      context?: Record<string, any>;
      userMessage?: string;
      service?: string;
      operation?: string;
      cause?: Error;
    } = {}
  ) {
    super(message, 'INTEGRATION_ERROR', {
      ...options,
      statusCode: 502,
      userVisible: true,
      userMessage: options.userMessage || 'An error occurred with an external service.',
      context: {
        ...options.context,
        service: options.service,
        operation: options.operation
      }
    });
  }
}

/**
 * Error thrown when there's a timeout
 */
export class TimeoutError extends AppError {
  constructor(
    message: string,
    options: {
      context?: Record<string, any>;
      userMessage?: string;
      operation?: string;
      timeoutMs?: number;
      cause?: Error;
    } = {}
  ) {
    super(message, 'TIMEOUT_ERROR', {
      ...options,
      statusCode: 504,
      userVisible: true,
      userMessage: options.userMessage || 'The operation timed out. Please try again.',
      context: {
        ...options.context,
        operation: options.operation,
        timeoutMs: options.timeoutMs
      }
    });
  }
}

/**
 * Error thrown when there's a conflict with the current state
 */
export class ConflictError extends AppError {
  constructor(
    message: string,
    options: {
      context?: Record<string, any>;
      userMessage?: string;
      resource?: string;
      conflictReason?: string;
      cause?: Error;
    } = {}
  ) {
    super(message, 'CONFLICT_ERROR', {
      ...options,
      statusCode: 409,
      userVisible: true,
      userMessage: options.userMessage || 'This operation conflicts with the current state.',
      context: {
        ...options.context,
        resource: options.resource,
        conflictReason: options.conflictReason
      }
    });
  }
}

/**
 * Error thrown for calendar-specific issues
 */
export class CalendarError extends AppError {
  constructor(
    message: string,
    options: {
      context?: Record<string, any>;
      userMessage?: string;
      code?: string;
      cause?: Error;
    } = {}
  ) {
    super(message, options.code || 'CALENDAR_ERROR', {
      ...options,
      statusCode: 400,
      userVisible: true,
      userMessage: options.userMessage || 'An error occurred with the calendar operation.'
    });
  }
}

/**
 * Error thrown for timezone-related issues
 * This extends the existing TimeZoneError functionality
 */
export class TimeZoneError extends AppError {
  constructor(
    message: string,
    options: {
      context?: Record<string, any>;
      userMessage?: string;
      code?: string;
      cause?: Error;
    } = {}
  ) {
    super(message, options.code || 'TIMEZONE_ERROR', {
      ...options,
      statusCode: 400,
      userVisible: true,
      userMessage: options.userMessage || 'An error occurred with timezone processing.'
    });
  }

  /**
   * Creates a user-friendly error message
   */
  static createUserFriendlyMessage(error: unknown): string {
    if (error instanceof TimeZoneError) {
      return error.getUserMessage();
    } else if (error instanceof Error) {
      return `Error processing timezone: ${error.message}`;
    }
    return 'An unknown error occurred while processing timezone data';
  }
}