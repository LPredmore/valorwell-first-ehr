
/**
 * Comprehensive utilities for debugging authentication issues
 */

/**
 * Logs detailed information about the current Supabase configuration
 */
export const logSupabaseConfig = () => {
  // Get environment variables (but don't log sensitive keys)
  const config = {
    url: import.meta.env.VITE_SUPABASE_URL || 'Not set',
    hasAnonymousKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    currentOrigin: window.location.origin,
    environment: import.meta.env.MODE || 'development'
  };
  
  console.log('[AuthDebug] Supabase configuration:', config);
  
  // Log storage type being used
  try {
    const storageType = window.localStorage ? 'localStorage' : 
                       (window.sessionStorage ? 'sessionStorage' : 'unknown');
    console.log('[AuthDebug] Browser storage type available:', storageType);
    
    // Check if localStorage has Supabase auth data
    const hasSupabaseAuth = !!localStorage.getItem('supabase.auth.token');
    console.log('[AuthDebug] Has stored auth data:', hasSupabaseAuth);
  } catch (e) {
    console.error('[AuthDebug] Error checking storage:', e);
  }
  
  return config;
};

/**
 * Logs information about the current URL and authentication state
 */
export const logAuthContext = (additionalContext = {}) => {
  const urlInfo = {
    fullUrl: window.location.href,
    pathname: window.location.pathname,
    hash: window.location.hash,
    search: window.location.search,
    hasResetToken: window.location.hash.includes('type=recovery'),
  };
  
  console.log('[AuthDebug] Current URL info:', urlInfo);
  console.log('[AuthDebug] Additional context:', additionalContext);
  
  return {
    urlInfo,
    additionalContext
  };
};

/**
 * Wraps an auth operation with timing and detailed logging
 */
export const debugAuthOperation = async (operationName: string, fn: () => Promise<any>) => {
  console.log(`[AuthDebug][${operationName}] Starting operation`);
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const duration = (performance.now() - startTime).toFixed(2);
    console.log(`[AuthDebug][${operationName}] Completed in ${duration}ms with result:`, result);
    return result;
  } catch (error: any) {
    const duration = (performance.now() - startTime).toFixed(2);
    console.error(`[AuthDebug][${operationName}] Failed after ${duration}ms with error:`, error);
    
    // Log specific error details based on error type
    if (error?.status) {
      console.error(`[AuthDebug][${operationName}] HTTP Status: ${error.status}`);
    }
    
    if (error?.message) {
      console.error(`[AuthDebug][${operationName}] Error message: ${error.message}`);
    }
    
    throw error;
  }
};

/**
 * Validates that the Supabase URL and redirect URL configurations are valid
 */
export const validateSupabaseUrls = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const origin = window.location.origin;
  
  const issues = [];
  
  if (!supabaseUrl) {
    issues.push('VITE_SUPABASE_URL environment variable is not set');
  }
  
  console.log(`[AuthDebug] URL validation: Supabase URL: ${supabaseUrl}, App origin: ${origin}`);
  
  return {
    supabaseUrl,
    origin,
    issues,
    isValid: issues.length === 0
  };
};

export default {
  logSupabaseConfig,
  logAuthContext,
  debugAuthOperation,
  validateSupabaseUrls
};
