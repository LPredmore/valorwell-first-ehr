import { useState, useCallback, useEffect, useRef } from 'react';

export type AsyncStatus = 'idle' | 'pending' | 'success' | 'error';

export interface AsyncState<T, E = Error> {
  data: T | null;
  error: E | null;
  status: AsyncStatus;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface AsyncStateOptions<T, P extends any[], E = Error> {
  asyncFunction: (...args: P) => Promise<T>;
  immediate?: boolean;
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: E) => void;
  resetOnUnmount?: boolean;
}

/**
 * A hook for managing asynchronous operations with loading, error, and data states.
 * 
 * @example
 * ```tsx
 * const fetchUser = async (id: string) => {
 *   const response = await fetch(`/api/users/${id}`);
 *   if (!response.ok) throw new Error('Failed to fetch user');
 *   return response.json();
 * };
 * 
 * const {
 *   data: user,
 *   isLoading,
 *   error,
 *   execute: fetchUserData,
 *   reset
 * } = useAsyncState({
 *   asyncFunction: fetchUser,
 *   immediate: false
 * });
 * 
 * // Later, trigger the fetch
 * useEffect(() => {
 *   if (userId) {
 *     fetchUserData(userId);
 *   }
 * }, [userId, fetchUserData]);
 * ```
 */
export function useAsyncState<T, P extends any[], E = Error>({
  asyncFunction,
  immediate = false,
  initialData = null,
  onSuccess,
  onError,
  resetOnUnmount = false
}: AsyncStateOptions<T, P, E>) {
  const [state, setState] = useState<AsyncState<T, E>>({
    data: initialData,
    error: null,
    status: 'idle',
    isLoading: false,
    isSuccess: false,
    isError: false
  });

  // Use a ref to track if the component is mounted
  const isMounted = useRef(true);
  
  // Store the latest asyncFunction in a ref to avoid unnecessary re-executions
  const asyncFunctionRef = useRef(asyncFunction);
  useEffect(() => {
    asyncFunctionRef.current = asyncFunction;
  }, [asyncFunction]);

  const execute = useCallback(
    async (...args: P) => {
      setState(prev => ({
        ...prev,
        status: 'pending',
        isLoading: true,
        isError: false,
        error: null
      }));

      try {
        const result = await asyncFunctionRef.current(...args);
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          setState({
            data: result,
            error: null,
            status: 'success',
            isLoading: false,
            isSuccess: true,
            isError: false
          });
          
          if (onSuccess) {
            onSuccess(result);
          }
        }
        
        return result;
      } catch (error) {
        // Only update state if component is still mounted
        if (isMounted.current) {
          setState({
            data: null,
            error: error as E,
            status: 'error',
            isLoading: false,
            isSuccess: false,
            isError: true
          });
          
          if (onError) {
            onError(error as E);
          }
        }
        
        throw error;
      }
    },
    [onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      error: null,
      status: 'idle',
      isLoading: false,
      isSuccess: false,
      isError: false
    });
  }, [initialData]);

  // Execute immediately if specified
  useEffect(() => {
    if (immediate) {
      // @ts-ignore - We're ignoring the type error here because we know that
      // if immediate is true, the function should be callable with no arguments
      execute();
    }
    
    return () => {
      isMounted.current = false;
      if (resetOnUnmount) {
        reset();
      }
    };
  }, [execute, immediate, reset, resetOnUnmount]);

  return {
    ...state,
    execute,
    reset
  };
}