// Extended query options with cache-specific settings
export interface CacheOptions {
  // Time in milliseconds that the data should be considered fresh
  staleTime?: number;
  
  // Time in milliseconds that unused/inactive data should be kept in memory
  cacheTime?: number;
  
  // Whether to refetch on window focus
  refetchOnWindowFocus?: boolean;
  
  // Whether to refetch on reconnect
  refetchOnReconnect?: boolean;
  
  // Number of retry attempts
  retry?: number | boolean;
  
  // Retry delay in milliseconds (or function to calculate delay)
  retryDelay?: number | ((attempt: number) => number);
  
  // Whether to keep previous data while fetching new data
  keepPreviousData?: boolean;
  
  // Function to determine if error is retryable
  retryOnError?: (error: any) => boolean;
}

// Cache configuration presets
export const cachePresets = {
  // Short-lived data that changes frequently (e.g., notifications)
  volatile: {
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2
  },
  
  // Standard data with moderate refresh (e.g., user dashboard data)
  standard: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3
  },
  
  // Data that rarely changes (e.g., user profile, settings)
  persistent: {
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 3
  },
  
  // Reference data that changes very infrequently (e.g., app configuration)
  reference: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    cacheTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1
  },
  
  // Real-time data that needs frequent updates (e.g., chat, collaborative features)
  realtime: {
    staleTime: 0, // Always stale (always refetch)
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000) // Exponential backoff with 30s max
  },
  
  // For paginated data
  paginated: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    keepPreviousData: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2
  }
};

// Get default query options with query key and preset
export const getQueryOptions = (
  queryKey: unknown[],
  preset: keyof typeof cachePresets = 'standard',
  customOptions: Partial<CacheOptions> = {}
) => {
  return {
    queryKey,
    ...cachePresets[preset],
    ...customOptions
  };
};

// Helper for paginated queries
export const getPaginatedQueryOptions = (
  baseQueryKey: unknown[],
  page = 1,
  limit = 10,
  customOptions: Partial<CacheOptions> = {}
) => {
  return getQueryOptions(
    [...baseQueryKey, page, limit],
    'paginated',
    customOptions
  );
};
