import { ZodError, ZodType } from 'zod';

/**
 * Validation result type
 * @template T The data type being validated
 */
export interface ValidationResult<T = any> {
  /**
   * Whether the validation was successful
   */
  success: boolean;
  
  /**
   * The validated data (only present if validation was successful)
   */
  data?: T;
  
  /**
   * Validation errors (only present if validation failed)
   */
  errors?: ValidationErrorDetail[];
}

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  /**
   * Path to the field with the error
   */
  path: string[];
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error code
   */
  code: string;
}

/**
 * Validation error
 */
export interface ValidationError {
  /**
   * Error message
   */
  message: string;
  
  /**
   * Path to the field with the error
   */
  path?: string[];
  
  /**
   * Error code
   */
  code?: string;
}

/**
 * Schema validator utility class
 */
export class SchemaValidator {
  /**
   * Validate data synchronously against a schema
   * @param schema The Zod schema to validate against
   * @param data The data to validate
   * @param options Optional validation options
   * @returns Validation result
   */
  static validate<T>(schema: ZodType<T>, data: unknown, options?: { throwOnError?: boolean }): ValidationResult<T> {
    try {
      const validatedData = schema.parse(data);
      return {
        success: true,
        data: validatedData
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          path: err.path.map(p => String(p)),
          message: err.message,
          code: err.code
        }));
        
        const result = {
          success: false,
          errors: validationErrors
        };
        
        if (options?.throwOnError) {
          throw error;
        }
        
        return result;
      }
      
      const result = {
        success: false,
        errors: [
          {
            path: ['_root'],
            message: error instanceof Error ? error.message : 'Unknown validation error',
            code: 'unknown_error'
          }
        ]
      };
      
      if (options?.throwOnError && error instanceof Error) {
        throw error;
      }
      
      return result;
    }
  }
  
  /**
   * Validate data asynchronously against a schema
   * @param schema The Zod schema to validate against
   * @param data The data to validate
   * @returns Promise resolving to a validation result
   */
  static async validateAsync<T>(schema: ZodType<T>, data: unknown): Promise<ValidationResult<T>> {
    try {
      const validatedData = await schema.parseAsync(data);
      return {
        success: true,
        data: validatedData
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          path: err.path.map(p => String(p)),
          message: err.message,
          code: err.code
        }));
        
        return {
          success: false,
          errors: validationErrors
        };
      }
      
      return {
        success: false,
        errors: [
          {
            path: ['_root'],
            message: error instanceof Error ? error.message : 'Unknown validation error',
            code: 'unknown_error'
          }
        ]
      };
    }
  }
  
  /**
   * Validate a subset of data against a schema
   * @param schema The Zod schema to validate against
   * @param data The data to validate
   * @param fields The fields to validate
   * @returns Validation result
   */
  static validateSubset<T>(schema: ZodType<T>, data: unknown, fields: string[]): ValidationResult<Partial<T>> {
    try {
      // Create a partial schema with only the specified fields
      const partialSchema = schema as any;
      const partialData = fields.reduce((acc: any, field) => {
        if (data && typeof data === 'object' && field in data) {
          acc[field] = (data as any)[field];
        }
        return acc;
      }, {});
      
      const validatedData = partialSchema.parse(partialData);
      
      return {
        success: true,
        data: validatedData
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          path: err.path.map(p => String(p)),
          message: err.message,
          code: err.code
        }));
        
        return {
          success: false,
          errors: validationErrors
        };
      }
      
      return {
        success: false,
        errors: [
          {
            path: ['_root'],
            message: error instanceof Error ? error.message : 'Unknown validation error',
            code: 'unknown_error'
          }
        ]
      };
    }
  }
  
  /**
   * Format validation errors into a record of field paths and error messages
   * @param errors Validation errors
   * @returns Record of field paths and error messages
   */
  static formatErrors(errors: ValidationErrorDetail[]): Record<string, string> {
    const formattedErrors: Record<string, string> = {};
    
    for (const error of errors) {
      const path = error.path.join('.');
      formattedErrors[path || '_root'] = error.message;
    }
    
    return formattedErrors;
  }
  
  /**
   * Create a validation error
   * @param message Error message
   * @param path Path to the field with the error
   * @param code Error code
   * @returns Validation error
   */
  static createError(message: string, path?: string[], code?: string): ValidationError {
    return {
      message,
      path,
      code
    };
  }
  
  /**
   * Convert a validation error to a validation result
   * @param error Validation error
   * @returns Validation result
   */
  static errorToResult(error: ValidationError): ValidationResult {
    return {
      success: false,
      errors: [
        {
          path: error.path || ['_root'],
          message: error.message,
          code: error.code || 'custom_error'
        }
      ]
    };
  }
}

// Export default for backward compatibility
export default {
  validate: SchemaValidator.validate,
  validateAsync: SchemaValidator.validateAsync,
  validateSubset: SchemaValidator.validateSubset,
  formatErrors: SchemaValidator.formatErrors,
  createError: SchemaValidator.createError,
  errorToResult: SchemaValidator.errorToResult
};
