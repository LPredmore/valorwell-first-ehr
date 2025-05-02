
/**
 * Calendar Error Handler
 * 
 * Centralizes error handling for calendar operations
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

export class CalendarErrorHandler {
  /**
   * Gets a user-friendly error message based on the error
   * @param error The error to process
   * @returns A user-friendly error message
   */
  static getUserFriendlyMessage(error: any): string {
    if (error instanceof CalendarError) {
      switch (error.code) {
        case 'INVALID_TIME_RANGE':
          return 'The selected time range is invalid. Please ensure the start time is before the end time.';
        case 'OVERLAPPING_EVENT':
          return 'This time slot overlaps with another event. Please choose a different time.';
        case 'INVALID_TIMEZONE':
          return 'The selected timezone is invalid. Please choose a valid timezone.';
        case 'INSUFFICIENT_PERMISSIONS':
          return 'You do not have permission to perform this action.';
        case 'EVENT_NOT_FOUND':
          return 'The requested event could not be found.';
        case 'DATABASE_ERROR':
          return 'There was a problem connecting to the database. Please try again later.';
        default:
          return error.message || 'An unexpected calendar error occurred.';
      }
    }
    
    // Handle database errors
    if (error?.message?.includes('duplicate key value')) {
      return 'This event conflicts with an existing event. Please try a different time.';
    }
    
    // Handle network errors
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return 'There was a network issue. Please check your connection and try again.';
    }
    
    return error?.message || 'An unexpected error occurred. Please try again later.';
  }
}

export default CalendarErrorHandler;
