
/**
 * CalendarErrorHandler - Standardizes error handling for calendar-related operations
 */
export class CalendarErrorHandler {
  /**
   * Create a standardized error object
   */
  static createError(message: string, code: string, details?: any): Error {
    const error = new Error(message);
    (error as any).code = code;
    (error as any).details = details;
    return error;
  }

  /**
   * Handle database errors from Supabase
   */
  static handleDatabaseError(error: any): Error {
    // Extract useful info from Supabase error format
    const message = error.message || 'Database operation failed';
    const code = error.code || 'UNKNOWN_ERROR';
    const details = {
      hint: error.hint,
      details: error.details,
      originalError: error
    };
    
    return this.createError(message, code, details);
  }

  /**
   * Format any type of error into a standardized error
   */
  static formatError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    
    return this.createError(
      typeof error === 'string' ? error : 'Unknown error occurred',
      'UNKNOWN_ERROR',
      { originalError: error }
    );
  }
}

/**
 * CalendarError - Standard error class for calendar operations
 * This is for backward compatibility with existing code that relies on CalendarError
 */
export class CalendarError extends Error {
  code: string;
  details?: any;
  
  constructor(message: string, code: string = 'CALENDAR_ERROR', details?: any) {
    super(message);
    this.name = 'CalendarError';
    this.code = code;
    this.details = details;
  }
}

export default CalendarErrorHandler;
