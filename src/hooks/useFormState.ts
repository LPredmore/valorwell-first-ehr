import { useState, useCallback, useEffect } from 'react';

export interface ValidationErrors {
  [key: string]: string;
}

export interface TouchedFields {
  [key: string]: boolean;
}

export interface FormStateOptions<T> {
  initialValues: T;
  validationSchema?: {
    validate: (values: T) => ValidationErrors;
  };
  onSubmit?: (values: T, formState: FormState<T>) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnMount?: boolean;
}

export interface FormState<T> {
  values: T;
  errors: ValidationErrors;
  touched: TouchedFields;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldTouched: (field: keyof T, isTouched?: boolean) => void;
  setFieldError: (field: keyof T, error: string | null) => void;
  resetForm: () => void;
  validateForm: () => ValidationErrors;
  setValues: (values: Partial<T>) => void;
  setTouched: (touched: Partial<TouchedFields>) => void;
  setErrors: (errors: ValidationErrors) => void;
}

/**
 * A hook for managing form state with validation.
 * 
 * @example
 * ```tsx
 * const validationSchema = {
 *   validate: (values) => {
 *     const errors: ValidationErrors = {};
 *     if (!values.name) errors.name = 'Name is required';
 *     if (!values.email) errors.email = 'Email is required';
 *     return errors;
 *   }
 * };
 * 
 * const {
 *   values,
 *   errors,
 *   touched,
 *   handleChange,
 *   handleBlur,
 *   handleSubmit,
 *   isSubmitting,
 *   isValid
 * } = useFormState({
 *   initialValues: { name: '', email: '' },
 *   validationSchema,
 *   onSubmit: async (values) => {
 *     await saveUser(values);
 *   }
 * });
 * ```
 */
export function useFormState<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
  validateOnMount = false
}: FormStateOptions<T>): FormState<T> {
  // Form state
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Validate the form
  const validateForm = useCallback(() => {
    if (!validationSchema) return {};
    
    try {
      const validationErrors = validationSchema.validate(values);
      setErrors(validationErrors);
      return validationErrors;
    } catch (error) {
      console.error('[useFormState] Validation error:', error);
      return {};
    }
  }, [values, validationSchema]);
  
  // Check if the form is valid
  const isValid = Object.keys(errors).length === 0;
  
  // Validate on mount if specified
  useEffect(() => {
    if (validateOnMount && validationSchema) {
      validateForm();
    }
  }, [validateOnMount, validateForm, validationSchema]);
  
  // Handle field change
  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => {
      const newValues = { ...prev, [field]: value };
      return newValues;
    });
    
    setIsDirty(true);
    
    if (validateOnChange && validationSchema) {
      setTimeout(() => {
        validateForm();
      }, 0);
    }
  }, [validateOnChange, validateForm, validationSchema]);
  
  // Set a field value
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    handleChange(field, value);
  }, [handleChange]);
  
  // Handle field blur
  const handleBlur = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (validateOnBlur && validationSchema) {
      setTimeout(() => {
        validateForm();
      }, 0);
    }
  }, [validateOnBlur, validateForm, validationSchema]);
  
  // Set a field as touched
  const setFieldTouched = useCallback((field: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);
  
  // Set a field error
  const setFieldError = useCallback((field: keyof T, error: string | null) => {
    setErrors(prev => {
      if (error === null) {
        const { [field as string]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [field]: error };
    });
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Validate all fields
    const validationErrors = validateForm();
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as TouchedFields);
    
    setTouched(allTouched);
    
    // If there are errors, don't submit
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    
    if (onSubmit) {
      setIsSubmitting(true);
      
      try {
        await onSubmit(values, {
          values,
          errors,
          touched,
          isSubmitting: true,
          isValid,
          isDirty,
          handleChange,
          handleBlur,
          handleSubmit,
          setFieldValue,
          setFieldTouched,
          setFieldError,
          resetForm: () => {}, // Will be defined below
          validateForm,
          setValues: () => {}, // Will be defined below
          setTouched: () => {}, // Will be defined below
          setErrors: () => {}, // Will be defined below
        });
      } catch (error) {
        console.error('[useFormState] Submit error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, errors, touched, isValid, isDirty, validateForm, onSubmit, handleChange, handleBlur, setFieldValue, setFieldTouched, setFieldError]);
  
  // Reset the form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsDirty(false);
  }, [initialValues]);
  
  // Update multiple values at once
  const setMultipleValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
    setIsDirty(true);
    
    if (validateOnChange && validationSchema) {
      setTimeout(() => {
        validateForm();
      }, 0);
    }
  }, [validateOnChange, validateForm, validationSchema]);
  
  // Update multiple touched fields at once
  const setMultipleTouched = useCallback((newTouched: Partial<TouchedFields>) => {
    setTouched(prev => ({ ...prev, ...newTouched }));
  }, []);
  
  // Update multiple errors at once
  const setMultipleErrors = useCallback((newErrors: ValidationErrors) => {
    setErrors(newErrors);
  }, []);
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    resetForm,
    validateForm,
    setValues: setMultipleValues,
    setTouched: setMultipleTouched,
    setErrors: setMultipleErrors
  };
}