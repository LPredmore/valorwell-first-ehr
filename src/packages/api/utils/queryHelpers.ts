
/**
 * Query Helper Functions
 * 
 * Reusable utilities for data fetching, error handling, and caching.
 */

import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

/**
 * Create a QueryClient with default configuration
 * @returns A configured QueryClient instance
 */
export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
};

/**
 * Hook for handling async operations with toast notifications
 * @returns Object with toast function and error handler
 */
export const useAsyncHandler = () => {
  const { toast } = useToast();
  
  const handleError = (error: any, customMessage?: string) => {
    console.error('Operation failed:', error);
    toast({
      title: "Error",
      description: customMessage || "An unexpected error occurred",
      variant: "destructive",
    });
  };
  
  const showSuccess = (message: string) => {
    toast({
      title: "Success",
      description: message,
    });
  };
  
  return { handleError, showSuccess };
};
