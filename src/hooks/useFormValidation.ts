import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { SchemaValidator, ValidationErrorDetail, ValidationResult } from '@/utils/validation/schemaValidator';

/**
 * Form validation state
 */
export interface FormValidationState<T> {
  /**
   * Whether the form is valid
   */
  isValid: boolean;
  
  /**
   * Whether the form has been touched (any field has been changed)
   */
  isDirty: boolean;
  
  /**
   * Whether the form is currently being validated
   */
  isValidating: boolean;
  
  /**
   * Validation errors by field path
   */
  errors: Record<string, string>;
  
  /**
   * Raw validation error details
   */
  errorDetails: ValidationErrorDetail[];
  
  /**
   * Validated form data (if valid)
   */
  validatedData?: T;
  
  /**
   * Validate the form data
   */
  validate: () => Promise<boolean>;
  
  /**
   * Validate a specific field
   */
  validateField: (fieldPath: string) => Promise<boolean>;
  
  /**
   * Set a field value and validate it
   */
  setFieldValue: (fieldPath: string, value: any) => void;
  
  /**
   * Mark a field as touched (for validation on blur)
   */
  touchField: (fieldPath: string) => void;
  
  /**
   * Reset the form validation state
   */
  reset: () => void;
  
  /**
   * Get props for a form field
   */
  getFieldProps: (fieldPath: string) => {
    value: any;
    onChange: (e: any) => void;
    onBlur: () => void;
    error?: string;
  };
}

/**
 * Options for the useFormValidation hook
 */
export interface FormValidationOptions<T> {
  /**
   * Initial form data
   */
  initialValues: Partial<T>;
  
  /**
   * Whether to validate on change (default: false)
   */
  validateOnChange?: boolean;
  
  /**
   * Whether to validate on blur (default: true)
   */
  validateOnBlur?: boolean;
  
  /**
   * Whether to validate all fields on submit (default: true)
   */
  validateOnSubmit?: boolean;
  
  /**
   * Callback when validation state changes
   */
  onValidationChange?: (state: FormValidationState<T>) => void;
}

/**
 * Hook for form validation using Zod schemas
 * 
 * @param schema The Zod schema to validate against
 * @param options Form validation options
 * @returns Form validation state and helpers
 */
export function useFormValidation<T>(
  schema: z.ZodType<T>,
  options: FormValidationOptions<T>
): FormValidationState<T> {
  const {
    initialValues,
    validateOnChange = false,
    validateOnBlur = true,
    validateOnSubmit = true,
    onValidationChange
  } = options;
  
  // Form state
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorDetails, setErrorDetails] = useState<ValidationErrorDetail[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [validatedData, setValidatedData] = useState<T | undefined>(undefined);
  
  /**
   * Validate the entire form
   */
  const validate = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    
    try {
      const result = await SchemaValidator.validateAsync(schema, values);
      
      if (result.success) {
        setErrors({});
        setErrorDetails([]);
        setIsValid(true);
        setValidatedData(result.data);
        return true;
      } else {
        const formattedErrors = SchemaValidator.formatErrors(result.errors || []);
        setErrors(formattedErrors);
        setErrorDetails(result.errors || []);
        setIsValid(false);
        setValidatedData(undefined);
        return false;
      }
    } catch (error) {
      console.error('Form validation error:', error);
      setIsValid(false);
      setValidatedData(undefined);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [schema, values]);
  
  /**
   * Validate a specific field
   */
  const validateField = useCallback(async (fieldPath: string): Promise<boolean> => {
    try {
      // Create a subset object with just the field to validate
      const fieldData = { [fieldPath]: values[fieldPath as keyof T] };
      
      // Validate just this field
      const result = await SchemaValidator.validateSubset(schema, fieldData, [fieldPath]);
      
      if (result.success) {
        // Remove error for this field
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldPath];
          return newErrors;
        });
        
        // Remove error details for this field
        setErrorDetails(prev => prev.filter(err => err.path[0] !== fieldPath));
        
        return true;
      } else {
        // Update errors for this field
        const formattedErrors = SchemaValidator.formatErrors(result.errors || []);
        setErrors(prev => ({ ...prev, ...formattedErrors }));
        
        // Update error details for this field
        setErrorDetails(prev => {
          const filtered = prev.filter(err => err.path[0] !== fieldPath);
          return [...filtered, ...(result.errors || [])];
        });
        
        return false;
      }
    } catch (error) {
      console.error(`Field validation error for ${fieldPath}:`, error);
      return false;
    }
  }, [schema, values]);
  
  /**
   * Set a field value and optionally validate it
   */
  const setFieldValue = useCallback((fieldPath: string, value: any) => {
    setValues(prev => {
      const newValues = { ...prev, [fieldPath]: value };
      return newValues;
    });
    
    setIsDirty(true);
    
    if (validateOnChange) {
      validateField(fieldPath);
    }
  }, [validateOnChange, validateField]);
  
  /**
   * Mark a field as touched and optionally validate it
   */
  const touchField = useCallback((fieldPath: string) => {
    setTouchedFields(prev => {
      const newTouched = new Set(prev);
      newTouched.add(fieldPath);
      return newTouched;
    });
    
    if (validateOnBlur) {
      validateField(fieldPath);
    }
  }, [validateOnBlur, validateField]);
  
  /**
   * Reset the form validation state
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setErrorDetails([]);
    setTouchedFields(new Set());
    setIsDirty(false);
    setIsValid(false);
    setValidatedData(undefined);
  }, [initialValues]);
  
  /**
   * Get props for a form field
   */
  const getFieldProps = useCallback((fieldPath: string) => {
    return {
      value: values[fieldPath as keyof T] ?? '',
      onChange: (e: any) => {
        const value = e.target?.value !== undefined ? e.target.value : e;
        setFieldValue(fieldPath, value);
      },
      onBlur: () => touchField(fieldPath),
      error: errors[fieldPath]
    };
  }, [values, errors, setFieldValue, touchField]);
  
  // Validate the form when values change (if validateOnChange is true)
  useEffect(() => {
    if (isDirty && validateOnChange) {
      validate();
    }
  }, [values, isDirty, validateOnChange, validate]);
  
  // Call onValidationChange when validation state changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange({
        isValid,
        isDirty,
        isValidating,
        errors,
        errorDetails,
        validatedData,
        validate,
        validateField,
        setFieldValue,
        touchField,
        reset,
        getFieldProps
      });
    }
  }, [
    isValid,
    isDirty,
    isValidating,
    errors,
    errorDetails,
    validatedData,
    validate,
    validateField,
    setFieldValue,
    touchField,
    reset,
    getFieldProps,
    onValidationChange
  ]);
  
  return {
    isValid,
    isDirty,
    isValidating,
    errors,
    errorDetails,
    validatedData,
    validate,
    validateField,
    setFieldValue: (fieldPath: string, value: any) => {
      setValues(prev => {
        const newValues = { ...prev, [fieldPath]: value };
        return newValues;
      });
      
      setIsDirty(true);
      
      if (validateOnChange) {
        validateField(fieldPath);
      }
    },
    touchField: (fieldPath: string) => {
      setTouchedFields(prev => {
        const newTouched = new Set(prev);
        newTouched.add(fieldPath);
        return newTouched;
      });
      
      if (validateOnBlur) {
        validateField(fieldPath);
      }
    },
    reset: () => {
      setValues(initialValues);
      setErrors({});
      setErrorDetails([]);
      setTouchedFields(new Set());
      setIsDirty(false);
      setIsValid(false);
      setValidatedData(undefined);
    },
    getFieldProps: (fieldPath: string) => {
      return {
        value: values[fieldPath as keyof T] ?? '',
        onChange: (e: any) => {
          const value = e.target?.value !== undefined ? e.target.value : e;
          setValues(prev => ({ ...prev, [fieldPath]: value }));
          setIsDirty(true);
          if (validateOnChange) {
            validateField(fieldPath);
          }
        },
        onBlur: () => {
          setTouchedFields(prev => {
            const newTouched = new Set(prev);
            newTouched.add(fieldPath);
            return newTouched;
          });
          if (validateOnBlur) {
            validateField(fieldPath);
          }
        },
        error: errors[fieldPath]
      };
    }
  };
}

export default useFormValidation;
