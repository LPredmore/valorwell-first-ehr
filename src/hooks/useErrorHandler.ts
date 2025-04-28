import { useState, useCallback, useMemo } from 'react';
import { 
  AppError, 
  ValidationError, 
  logError, 
  formatErrorForUser,
  tryCatch,
  handleApiError,
  handleNetworkError,
  handleDatabaseError
} from '@/utils/errors';

interface ErrorState {
  error: Error | null;
  message: string;
  code: string;
  isVisible: boolean;
  timestamp: number;
}

interface ValidationErrors {
  [field: string]: string;
}

interface UseErrorHandlerOptions {
  /**
   * Whether to automatically log errors (default: true)
   */
  logErrors?: boolean;
  
  /**
   * Whether to show errors to the user (default: true)
   */
  showErrors?: boolean;
  
  /**
   * Custom error formatter
   */
  formatError?: (error: Error) => { message: string; code: string };
  
  /**
   * Callback to run when an error occurs
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for handling errors in React components
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { 
    logErrors = true, 
    showErrors = true,
    formatError = formatErrorForUser,
    onError
  } = options;
  
  // State for general errors
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    message: '',
    code: '',
    isVisible: false,
    timestamp: 0
  });
  
  // State for validation errors (field-specific)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // State for tracking if an operation is in progress
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrorState({
      error: null,
      message: '',
      code: '',
      isVisible: false,
      timestamp: 0
    });
    setValidationErrors({});
  }, []);
  
  /**
   * Clear a specific validation error
   */
  const clearValidationError = useCallback((field: string) => {
    setValidationErrors(prev => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  }, []);
  
  /**
   * Handle an error
   */
  const handleError = useCallback((error: unknown, context?: Record<string, any>) => {
    // Convert to Error if it's not already
    const actualError = error instanceof Error 
      ? error 
      : new Error(typeof error === 'string' ? error : 'Unknown error');
    
    // Log the error if enabled
    if (logErrors) {
      logError(actualError, context);
    }
    
    // Call onError callback if provided
    if (onError) {
      onError(actualError);
    }
    
    // Handle validation errors specially
    if (actualError instanceof ValidationError && actualError.context?.field) {
      setValidationErrors(prev => ({
        ...prev,
        [actualError.context!.field as string]: actualError.getUserMessage()
      }));
      
      // Still show the general error if showErrors is true
      if (showErrors) {
        const { message, code } = formatError(actualError);
        setErrorState({
          error: actualError,
          message,
          code,
          isVisible: true,
          timestamp: Date.now()
        });
      }
      
      return;
    }
    
    // For other errors, update the error state if showErrors is true
    if (showErrors) {
      const { message, code } = formatError(actualError);
      setErrorState({
        error: actualError,
        message,
        code,
        isVisible: true,
        timestamp: Date.now()
      });
    }
  }, [logErrors, showErrors, formatError, onError]);
  
  /**
   * Dismiss the current error
   */
  const dismissError = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);
  
  /**
   * Wrap an async function with error handling
   */
  const withErrorHandling = useCallback(<T>(
    fn: () => Promise<T>,
    options: {
      context?: Record<string, any>;
      setLoading?: boolean;
      errorHandler?: (error: any) => AppError;
    } = {}
  ): Promise<T> => {
    const { context = {}, setLoading = true, errorHandler } = options;
    
    if (setLoading) {
      setIsLoading(true);
    }
    
    return tryCatch(
      async () => {
        try {
          const result = await fn();
          if (setLoading) {
            setIsLoading(false);
          }
          return result;
        } catch (error) {
          if (setLoading) {
            setIsLoading(false);
          }
          throw error;
        }
      },
      (error) => {
        // Use custom error handler if provided, otherwise use default
        const handledError = errorHandler 
          ? errorHandler(error)
          : handleApiError(error);
        
        // Handle the error
        handleError(handledError, context);
        
        return handledError;
      }
    );
  }, [handleError]);
  
  /**
   * Handle form submission with validation
   */
  const handleFormSubmission = useCallback(async <T>(
    submitFn: () => Promise<T>,
    validateFn?: () => ValidationErrors | Promise<ValidationErrors>,
    options: {
      context?: Record<string, any>;
      clearPreviousErrors?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { context = {}, clearPreviousErrors = true } = options;
    
    try {
      // Clear previous errors if requested
      if (clearPreviousErrors) {
        clearErrors();
      }
      
      // Validate if a validation function is provided
      if (validateFn) {
        const errors = await validateFn();
        
        // If there are validation errors, set them and return null
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          return null;
        }
      }
      
      // Set loading state
      setIsLoading(true);
      
      // Submit the form
      const result = await submitFn();
      
      // Clear loading state
      setIsLoading(false);
      
      return result;
    } catch (error) {
      // Clear loading state
      setIsLoading(false);
      
      // Handle the error
      handleError(error, context);
      
      return null;
    }
  }, [clearErrors, handleError]);
  
  /**
   * Handle API requests with error handling
   */
  const handleApiRequest = useCallback(<T>(
    requestFn: () => Promise<T>,
    options: {
      context?: Record<string, any>;
      setLoading?: boolean;
    } = {}
  ): Promise<T | null> => {
    return withErrorHandling(requestFn, {
      ...options,
      errorHandler: handleApiError
    });
  }, [withErrorHandling]);
  
  /**
   * Handle database operations with error handling
   */
  const handleDatabaseOperation = useCallback(<T>(
    operationFn: () => Promise<T>,
    options: {
      context?: Record<string, any>;
      operation?: string;
      table?: string;
      setLoading?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { operation, table, ...rest } = options;
    
    return withErrorHandling(operationFn, {
      ...rest,
      errorHandler: (error) => handleDatabaseError(error, operation, table)
    });
  }, [withErrorHandling]);
  
  /**
   * Handle network requests with error handling
   */
  const handleNetworkRequest = useCallback(<T>(
    requestFn: () => Promise<T>,
    options: {
      context?: Record<string, any>;
      url?: string;
      setLoading?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { url, ...rest } = options;
    
    return withErrorHandling(requestFn, {
      ...rest,
      errorHandler: (error) => handleNetworkError(error, url)
    });
  }, [withErrorHandling]);
  
  // Return values and functions
  return useMemo(() => ({
    // Error state
    error: errorState.error,
    errorMessage: errorState.message,
    errorCode: errorState.code,
    isErrorVisible: errorState.isVisible,
    errorTimestamp: errorState.timestamp,
    
    // Validation errors
    validationErrors,
    hasValidationErrors: Object.keys(validationErrors).length > 0,
    getFieldError: (field: string) => validationErrors[field] || '',
    isFieldValid: (field: string) => !validationErrors[field],
    
    // Loading state
    isLoading,
    
    // Error handling functions
    handleError,
    dismissError,
    clearErrors,
    clearValidationError,
    
    // Async operation handlers
    withErrorHandling,
    handleFormSubmission,
    handleApiRequest,
    handleDatabaseOperation,
    handleNetworkRequest
  }), [
    errorState,
    validationErrors,
    isLoading,
    handleError,
    dismissError,
    clearErrors,
    clearValidationError,
    withErrorHandling,
    handleFormSubmission,
    handleApiRequest,
    handleDatabaseOperation,
    handleNetworkRequest
  ]);
}

export default useErrorHandler;