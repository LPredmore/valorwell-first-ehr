
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  fallbackUI?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class CalendarErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('[CalendarErrorBoundary] Calendar component error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  // Format error message to be more user-friendly
  formatErrorMessage = (error: Error | null): string => {
    if (!error) return 'Unknown error occurred';
    
    // Handle case when error is stringified object
    if (error.message.includes('[object Object]')) {
      return 'An error occurred while processing calendar data';
    }
    
    // Try to extract useful information from the error
    if (error.message.includes('Invalid DateTime')) {
      return 'Calendar error: Invalid date or time format detected';
    } else if (error.message.includes('timezone')) {
      return 'Calendar error: Problem with timezone conversion';
    }
    
    return error.message || 'Unknown calendar error';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallbackUI) {
        return this.props.fallbackUI;
      }

      const errorMessage = this.formatErrorMessage(this.state.error);

      return (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Calendar Error</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>An error occurred while rendering the calendar.</p>
            <p className="text-xs text-gray-500">{errorMessage}</p>
            {this.state.error && this.state.error.stack && (
              <details className="text-xs text-gray-500 mt-2">
                <summary>Technical Details</summary>
                <pre className="whitespace-pre-wrap overflow-auto max-h-40 p-2 bg-gray-100 rounded">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <Button onClick={this.handleRetry} variant="outline" size="sm" className="mt-2">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default CalendarErrorBoundary;
