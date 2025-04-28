import React, { createContext, useContext, useState, ReactNode } from 'react';

// Generic type for form values
type FormValues = Record<string, any>;

// Generic type for form errors
type FormErrors = Record<string, string | undefined>;

// Generic type for touched fields
type TouchedFields = Record<string, boolean>;

interface FormContextState<T extends FormValues> {
  // Form state
  values: T;
  errors: FormErrors;
  touched: TouchedFields;
  isSubmitting: boolean;
  isValid: boolean;
  
  // Form actions
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error?: string) => void;
  setFieldTouched: (field: keyof T, isTouched?: boolean) => void;
  resetForm: (newValues?: Partial<T>) => void;
  validateForm: () => boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
}

// Create context with undefined initial value
const FormContext = createContext<FormContextState<any> | undefined>(undefined);

interface FormProviderProps<T extends FormValues> {
  children: ReactNode;
  initialValues: T;
  validationSchema?: {
    validate: (values: T) => FormErrors;
  };
  onSubmit: (values: T) => Promise<void> | void;
}

export function FormProvider<T extends FormValues>({
  children,
  initialValues,
  validationSchema,
  onSubmit
}: FormProviderProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = (field: keyof T, value: any): string | undefined => {
    if (!validationSchema) return undefined;
    
    const fieldErrors = validationSchema.validate({ ...values, [field]: value });
    return fieldErrors[field as string];
  };

  // Validate the entire form
  const validateForm = (): boolean => {
    if (!validationSchema) return true;
    
    const formErrors = validationSchema.validate(values);
    setErrors(formErrors);
    
    return Object.keys(formErrors).length === 0;
  };

  // Handle field change
  const handleChange = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    if (touched[field as string]) {
      const fieldError = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: fieldError }));
    }
  };

  // Handle field blur
  const handleBlur = (field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const fieldError = validateField(field, values[field as keyof T]);
    setErrors(prev => ({ ...prev, [field]: fieldError }));
  };

  // Set field value programmatically
  const setFieldValue = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  // Set field error programmatically
  const setFieldError = (field: keyof T, error?: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Set field touched programmatically
  const setFieldTouched = (field: keyof T, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  };

  // Reset form to initial values or new values
  const resetForm = (newValues?: Partial<T>) => {
    setValues(prev => ({ ...initialValues, ...newValues }));
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const isValid = validateForm();
    
    if (!isValid) {
      // Mark all fields as touched to show all errors
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as TouchedFields
      );
      setTouched(allTouched);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = Object.keys(errors).length === 0;

  const contextValue: FormContextState<T> = {
    // State
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    
    // Actions
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    validateForm,
    handleSubmit
  };

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  );
}

// Custom hook to use the form context
export function useForm<T extends FormValues>(): FormContextState<T> {
  const context = useContext(FormContext);
  
  if (context === undefined) {
    throw new Error('useForm must be used within a FormProvider');
  }
  
  return context as FormContextState<T>;
}

// Higher-order component to create a form context for a specific component
export function withFormContext<T extends FormValues>(
  Component: React.ComponentType<any>,
  initialValues: T,
  validationSchema?: { validate: (values: T) => FormErrors },
  onSubmit?: (values: T) => Promise<void> | void
) {
  return function WithFormContext(props: any) {
    return (
      <FormProvider
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit || props.onSubmit}
      >
        <Component {...props} />
      </FormProvider>
    );
  };
}