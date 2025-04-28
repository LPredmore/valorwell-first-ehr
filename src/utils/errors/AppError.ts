/**
 * Base error class for all application errors
 * All custom error types should extend this class
 */
export class AppError extends Error {
  /** Error code for categorizing errors */
  code: string;
  
  /** Additional context information about the error */
  context?: Record<string, any>;
  
  /** HTTP status code (if applicable) */
  statusCode?: number;
  
  /** Whether this error should be reported to monitoring services */
  reportable: boolean;
  
  /** Whether this error can be shown to end users */
  userVisible: boolean;
  
  /** User-friendly error message (if different from technical message) */
  userMessage?: string;

  constructor(
    message: string, 
    code: string = 'UNKNOWN_ERROR', 
    options: {
      context?: Record<string, any>;
      statusCode?: number;
      reportable?: boolean;
      userVisible?: boolean;
      userMessage?: string;
      cause?: Error;
    } = {}
  ) {
    // Pass the cause to the Error constructor if available (for error chaining)
    super(message);
    
    // Set cause property manually since it might not be supported in the current TS version
    if (options.cause) {
      Object.defineProperty(this, 'cause', {
        value: options.cause,
        configurable: true,
        writable: true,
      });
    }
    
    this.name = this.constructor.name;
    this.code = code;
    this.context = options.context;
    this.statusCode = options.statusCode;
    this.reportable = options.reportable ?? true;
    this.userVisible = options.userVisible ?? false;
    this.userMessage = options.userMessage;
    
    // Ensures proper stack trace in modern JS environments
    // Ensures proper stack trace in modern JS environments
    // Using try-catch to handle environments where captureStackTrace is not available
    try {
      const captureStackTrace = (Error as any).captureStackTrace;
      if (typeof captureStackTrace === 'function') {
        captureStackTrace(this, this.constructor);
      }
    } catch (e) {
      // Fallback: do nothing if captureStackTrace is not available
    }
  }

  /**
   * Get a user-friendly message for this error
   */
  getUserMessage(): string {
    return this.userMessage || this.message;
  }

  /**
   * Convert the error to a plain object for logging or serialization
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      userMessage: this.userMessage,
      context: this.context,
      stack: this.stack
    };
  }

  /**
   * Create a copy of this error with additional context
   */
  withContext(additionalContext: Record<string, any>): this {
    const newContext = { ...this.context, ...additionalContext };
    
    // Create a new instance with the same properties but updated context
    const ErrorConstructor = this.constructor as new (
      message: string,
      code: string,
      options: any
    ) => this;
    
    return new ErrorConstructor(this.message, this.code, {
      context: newContext,
      statusCode: this.statusCode,
      reportable: this.reportable,
      userVisible: this.userVisible,
      userMessage: this.userMessage,
      cause: (this as any).cause as Error | undefined
    });
  }
}