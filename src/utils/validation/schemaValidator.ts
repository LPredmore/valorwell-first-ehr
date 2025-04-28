
import { z } from 'zod';
import { ValidationError } from '@/utils/errors';

/**
 * Type for validation error details
 */
export interface ValidationErrorDetail {
  path: (string | number)[];
  message: string;
  code?: string;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationErrorDetail[];
}

/**
 * Options for schema validation
 */
export interface SchemaValidationOptions {
  /**
   * Whether to throw an error on validation failure (default: false)
   */
  throwOnError?: boolean;
  
  /**
   * Custom error message for validation failures
   */
  errorMessage?: string;
  
  /**
   * Field name for error context (useful for nested validations)
   */
  fieldName?: string;
  
  /**
   * Whether to strip unknown properties from the validated object (default: false)
   */
  stripUnknown?: boolean;
}

/**
 * Schema validator for validating objects against schemas
 * Provides both synchronous and asynchronous validation
 */
export class SchemaValidator {
  /**
   * Validates an object against a Zod schema synchronously
   * 
   * @param schema The Zod schema to validate against
   * @param data The data to validate
   * @param options Validation options
   * @returns A validation result object
   * @throws ValidationError if throwOnError is true and validation fails
   */
  static validate<T>(
    schema: z.ZodType<T>,
    data: unknown,
    options: SchemaValidationOptions = {}
  ): ValidationResult<T> {
    const { throwOnError = false, errorMessage, fieldName, stripUnknown = false } = options;
    
    try {
      // Parse the data with the schema
      const parseResult = schema.safeParse(data);
      
      if (parseResult.success) {
        return {
          success: true,
          data: parseResult.data
        };
      } else {
        // Extract error details from Zod validation errors
        const errors = parseResult.error.errors.map(err => ({
          path: err.path,
          message: err.message,
          code: err.code
        })) as ValidationErrorDetail[];
        
        // Create a validation result with errors
        const result: ValidationResult<T> = {
          success: false,
          errors
        };
        
        // Throw an error if requested
        if (throwOnError) {
          const message = errorMessage || 
            `Validation failed${fieldName ? ` for ${fieldName}` : ''}: ${errors.map(e => 
              `${e.path.join('.')}: ${e.message}`).join(', ')}`;
          
          throw new ValidationError(message, {
            field: fieldName,
            context: { errors },
            userMessage: message
          });
        }
        
        return result;
      }
    } catch (error) {
      // Handle non-Zod errors
      if (error instanceof ValidationError) {
        throw error;
      }
      
      const message = errorMessage || 
        `Validation error${fieldName ? ` for ${fieldName}` : ''}: ${(error as Error).message}`;
      
      const result: ValidationResult<T> = {
        success: false,
        errors: [{
          path: fieldName ? [fieldName] : [],
          message: (error as Error).message
        }]
      };
      
      if (throwOnError) {
        throw new ValidationError(message, {
          field: fieldName,
          context: { originalError: error },
          userMessage: message
        });
      }
      
      return result;
    }
  }
  
  /**
   * Validates an object against a Zod schema asynchronously
   * 
   * @param schema The Zod schema to validate against
   * @param data The data to validate
   * @param options Validation options
   * @returns A promise that resolves to a validation result
   * @throws ValidationError if throwOnError is true and validation fails
   */
  static async validateAsync<T>(
    schema: z.ZodType<T>,
    data: unknown,
    options: SchemaValidationOptions = {}
  ): Promise<ValidationResult<T>> {
    const { throwOnError = false, errorMessage, fieldName, stripUnknown = false } = options;
    
    try {
      // Parse the data with the schema asynchronously
      const parseResult = await schema.safeParseAsync(data);
      
      if (parseResult.success) {
        return {
          success: true,
          data: parseResult.data
        };
      } else {
        // Extract error details from Zod validation errors
        const errors = parseResult.error.errors.map(err => ({
          path: err.path,
          message: err.message,
          code: err.code
        })) as ValidationErrorDetail[];
        
        // Create a validation result with errors
        const result: ValidationResult<T> = {
          success: false,
          errors
        };
        
        // Throw an error if requested
        if (throwOnError) {
          const message = errorMessage || 
            `Validation failed${fieldName ? ` for ${fieldName}` : ''}: ${errors.map(e => 
              `${e.path.join('.')}: ${e.message}`).join(', ')}`;
          
          throw new ValidationError(message, {
            field: fieldName,
            context: { errors },
            userMessage: message
          });
        }
        
        return result;
      }
    } catch (error) {
      // Handle non-Zod errors
      if (error instanceof ValidationError) {
        throw error;
      }
      
      const message = errorMessage || 
        `Validation error${fieldName ? ` for ${fieldName}` : ''}: ${(error as Error).message}`;
      
      const result: ValidationResult<T> = {
        success: false,
        errors: [{
          path: fieldName ? [fieldName] : [],
          message: (error as Error).message
        }]
      };
      
      if (throwOnError) {
        throw new ValidationError(message, {
          field: fieldName,
          context: { originalError: error },
          userMessage: message
        });
      }
      
      return result;
    }
  }
  
  /**
   * Validates a partial object against a Zod schema
   * Useful for validating form inputs that may be incomplete
   * 
   * @param schema The Zod schema to validate against
   * @param data The partial data to validate
   * @param options Validation options
   * @returns A validation result
   */
  static validatePartial<T>(
    schema: z.ZodType<T>,
    data: unknown,
    options: SchemaValidationOptions = {}
  ): ValidationResult<Partial<T>> {
    // Create a partial schema by making all properties optional
    const partialSchema = schema.optional() as z.ZodType<Partial<T>>;
    
    // Validate with the partial schema
    return this.validate(partialSchema, data, options);
  }
  
  /**
   * Validates a nested object field
   * 
   * @param schema The schema for the nested object
   * @param data The nested object data
   * @param fieldName The field name for error context
   * @param options Validation options
   * @returns The validated data if successful
   * @throws ValidationError if validation fails
   */
  static validateNested<T>(
    schema: z.ZodType<T>,
    data: unknown,
    fieldName: string,
    options: SchemaValidationOptions = {}
  ): T {
    const result = this.validate(schema, data, {
      ...options,
      fieldName,
      throwOnError: true
    });
    
    return result.data as T;
  }
  
  /**
   * Creates a validation error from validation result errors
   * 
   * @param errors The validation error details
   * @param fieldName Optional field name for context
   * @returns A ValidationError
   */
  static createValidationError(
    errors: ValidationErrorDetail[],
    fieldName?: string
  ): ValidationError {
    const message = `Validation failed${fieldName ? ` for ${fieldName}` : ''}: ${
      errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    }`;
    
    return new ValidationError(message, {
      field: fieldName,
      context: { errors },
      userMessage: message
    });
  }
  
  /**
   * Formats validation errors into a user-friendly object
   * 
   * @param errors The validation error details
   * @returns An object mapping field paths to error messages
   */
  static formatErrors(errors: ValidationErrorDetail[]): Record<string, string> {
    const formattedErrors: Record<string, string> = {};
    
    for (const error of errors) {
      const path = error.path.join('.');
      formattedErrors[path] = error.message;
    }
    
    return formattedErrors;
  }
}

// Export a default instance for convenience
export default SchemaValidator;
