
/**
 * CalendarErrorHandler - Specialized error handling for calendar operations
 * Provides consistent error formatting and handling across calendar services
 */

// Fix the import path to use the correct location for AppError
import { AppError } from '@/utils/errors/errorHandler';

export type CalendarErrorCode = 
  | 'CALENDAR_DB_ERROR' 
  | 'CALENDAR_CONVERSION_ERROR' 
  | 'CALENDAR_VALIDATION_ERROR' 
  | 'CALENDAR_TIMEZONE_ERROR'
  | 'CALENDAR_AUTHORIZATION_ERROR'
  | 'CALENDAR_NETWORK_ERROR'
  | 'CALENDAR_UNKNOWN_ERROR'
  | 'VALIDATION_ERROR';

// Make sure CalendarError properly extends AppError with all required properties
export class CalendarError extends AppError {
  name: string; // Add explicit name property to satisfy TypeScript
  
  constructor(message: string, code: CalendarErrorCode, context?: Record<string, any>) {
    super(message, code, context);
    this.name = 'CalendarError';
  }
}

export class CalendarErrorHandler {
  /**
   * Create a new calendar-specific error
   */
  static createError(message: string, code: CalendarErrorCode, context?: Record<string, any>): CalendarError {
    return new CalendarError(message, code, context);
  }

  /**
   * Handle database-specific errors
   */
  static handleDatabaseError(error: any): CalendarError {
    // Process database errors manually since we can't rely on the core error handler
    console.error('Database error:', error);
    
    let errorCode: CalendarErrorCode = 'CALENDAR_DB_ERROR';
    let errorMessage = 'A database error occurred';
    
    // Extract error code from Supabase error if available
    if (error?.code === '23505') {
      errorMessage = 'This calendar record already exists.';
      errorCode = 'CALENDAR_DB_ERROR';
    } else if (error?.code === '23503') {
      errorMessage = 'Referenced record does not exist.';
      errorCode = 'CALENDAR_DB_ERROR';
    } else if (error?.code?.startsWith('22')) {
      errorMessage = 'Invalid data format.';
      errorCode = 'CALENDAR_DB_ERROR';
    }
    
    return new CalendarError(
      error?.message || errorMessage,
      errorCode,
      { originalError: error }
    );
  }

  /**
   * Format any error type into a standardized CalendarError
   */
  static formatError(error: unknown): CalendarError {
    // If it's already a CalendarError, return it
    if (error instanceof CalendarError) {
      return error;
    }
    
    // Handle standard Error objects
    if (error instanceof Error) {
      let errorCode: CalendarErrorCode = 'CALENDAR_UNKNOWN_ERROR';
      
      // Try to infer the error type from the message
      if (error.message.includes('timezone') || error.message.includes('time zone')) {
        errorCode = 'CALENDAR_TIMEZONE_ERROR';
      } else if (error.message.includes('validation') || error.message.includes('invalid')) {
        errorCode = 'CALENDAR_VALIDATION_ERROR';
      } else if (error.message.includes('conversion') || error.message.includes('transform')) {
        errorCode = 'CALENDAR_CONVERSION_ERROR';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorCode = 'CALENDAR_NETWORK_ERROR';
      } else if (error.message.includes('permission') || error.message.includes('authorize')) {
        errorCode = 'CALENDAR_AUTHORIZATION_ERROR';
      }
      
      return new CalendarError(
        error.message, 
        errorCode, 
        { originalError: error }
      );
    }
    
    // Handle other types of errors
    return new CalendarError(
      String(error) || 'Unknown calendar error occurred',
      'CALENDAR_UNKNOWN_ERROR',
      { originalError: error }
    );
  }

  /**
   * Get a user-friendly error message
   */
  static getUserFriendlyMessage(error: unknown): string {
    const calendarError = this.formatError(error);
    
    // Provide friendly messages based on error code
    switch (calendarError.code as CalendarErrorCode) { // Add type assertion for code property
      case 'CALENDAR_TIMEZONE_ERROR':
        return 'There was an issue with timezone conversion. Please check your timezone settings.';
      case 'CALENDAR_VALIDATION_ERROR':
      case 'VALIDATION_ERROR':
        return 'The calendar data is invalid. Please check your input and try again.';
      case 'CALENDAR_CONVERSION_ERROR':
        return 'There was an error processing calendar data. Please try again.';
      case 'CALENDAR_NETWORK_ERROR':
        return 'Could not connect to the calendar service. Please check your internet connection.';
      case 'CALENDAR_AUTHORIZATION_ERROR':
        return 'You do not have permission to perform this action. Please check your login status.';
      case 'CALENDAR_DB_ERROR':
        return 'There was a problem accessing calendar data. Please try again later.';
      default:
        return 'An unexpected error occurred with the calendar. Please try again later.';
    }
  }
}
