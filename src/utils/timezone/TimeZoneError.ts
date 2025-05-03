
/**
 * Custom error class for TimeZone related errors
 */
export class TimeZoneError extends Error {
  code: string;
  details: Record<string, any>;

  constructor(
    message: string,
    code: string = 'TIMEZONE_ERROR',
    details: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'TimeZoneError';
    this.code = code;
    this.details = details;
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, TimeZoneError.prototype);
  }
}
