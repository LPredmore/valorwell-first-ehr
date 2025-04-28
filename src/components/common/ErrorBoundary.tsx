import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppError, formatErrorForUser, logError } from '@/utils/errors';

interface ErrorBoundaryProps {
  /** The children to render */
  children: ReactNode;
  
  /** Optional callback to handle retry attempts */
  onRetry?: () => void;
  
  /** Optional custom fallback UI to display when an error occurs */
  fallbackUI?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  
  /** Optional error handler to process errors before displaying */
  errorHandler?: (error: Error) => void;
  
  /** Optional flag to show technical details (default: false) */
  showTechnicalDetails?: boolean;
  
  /** Optional custom error title */
  errorTitle?: string;
  
  /** Optional custom error message */
  errorMessage?: string | ((error: Error) => string);
  
  /** Optional component to wrap the error UI */
  wrapper?: React.ComponentType<{ children: ReactNode }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * A React error boundary component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Capture and log the error
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.errorHandler) {
      this.props.errorHandler(error);
    }
    
    // Log the error using our error logging system
    logError(error, { 
      componentStack: errorInfo.componentStack,
      source: 'react-error-boundary'
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  // Format error message to be more user-friendly
  formatErrorMessage = (error: Error | null): string => {
    if (!error) return 'Unknown error occurred';
    
    // If a custom error message function is provided, use it
    if (typeof this.props.errorMessage === 'function') {
      return this.props.errorMessage(error);
    }
    
    // If a custom error message string is provided, use it
    if (typeof this.props.errorMessage === 'string') {
      return this.props.errorMessage;
    }
    
    // If it's an AppError, use its user message
    if (error instanceof AppError) {
      return error.getUserMessage();
    }
    
    // Format the error for user display
    const formattedError = formatErrorForUser(error);
    return formattedError.message;
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback UI is provided as a function, call it with the error and reset function
      if (typeof this.props.fallbackUI === 'function') {
        return this.props.fallbackUI(this.state.error!, this.handleRetry);
      }
      
      // If a custom fallback UI is provided as a ReactNode, return it
      if (this.props.fallbackUI) {
        return this.props.fallbackUI;
      }

      // Default error UI
      const errorMessage = this.formatErrorMessage(this.state.error);
      const errorTitle = this.props.errorTitle || 'Something went wrong';
      
      const ErrorContent = (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{errorTitle}</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>{errorMessage}</p>
            
            {this.props.showTechnicalDetails && this.state.error && (
              <details className="text-xs text-gray-500 mt-2">
                <summary>Technical Details</summary>
                <div className="mt-2">
                  <p><strong>Error:</strong> {this.state.error.toString()}</p>
                  {this.state.error.stack && (
                    <pre className="whitespace-pre-wrap overflow-auto max-h-40 p-2 bg-gray-100 rounded mt-2">
                      {this.state.error.stack}
                    </pre>
                  )}
                  {this.state.errorInfo && this.state.errorInfo.componentStack && (
                    <>
                      <p className="mt-2"><strong>Component Stack:</strong></p>
                      <pre className="whitespace-pre-wrap overflow-auto max-h-40 p-2 bg-gray-100 rounded mt-2">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
            
            <Button onClick={this.handleRetry} variant="outline" size="sm" className="mt-2">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      );
      
      // If a wrapper component is provided, wrap the error content with it
      if (this.props.wrapper) {
        const Wrapper = this.props.wrapper;
        return <Wrapper>{ErrorContent}</Wrapper>;
      }
      
      return ErrorContent;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;