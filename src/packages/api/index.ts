
/**
 * API Package
 * 
 * This package provides a centralized API layer for interacting with the Supabase backend.
 * It includes data access patterns, error handling, and caching strategies.
 */

// Client
export * from './client';

// Supabase client instance (re-exported for convenience)
export { supabase } from '@/integrations/supabase/client';

// Common data fetching utilities
export * from './utils/queryHelpers';
