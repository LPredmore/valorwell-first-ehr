
/**
 * Specialized error class for timezone operations
 */
export class TimeZoneError extends Error {
  context?: Record<string, any>;
  code: string;

  constructor(message: string, code: string = 'TIMEZONE_ERROR', context?: Record<string, any>) {
    super(message);
    this.name = 'TimeZoneError';
    this.code = code;
    this.context = context;
  }

  /**
   * Creates a user-friendly error message
   */
  static createUserFriendlyMessage(error: unknown): string {
    if (error instanceof TimeZoneError) {
      return `Timezone error: ${error.message}`;
    } else if (error instanceof Error) {
      return `Error processing timezone: ${error.message}`;
    }
    return 'An unknown error occurred while processing timezone data';
  }
}
