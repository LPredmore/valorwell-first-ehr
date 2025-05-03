
/**
 * Error class for timezone-related errors
 */
export class TimeZoneError extends Error {
  code: string;
  details: Record<string, any>;
  
  constructor(message: string, code: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'TimeZoneError';
    this.code = code;
    this.details = details;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeZoneError);
    }
  }
}

export default TimeZoneError;
