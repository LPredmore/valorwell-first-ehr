
// Client
export { supabase } from './client';

// Services
export { 
  signIn,
  signUp,
  resetPassword,
  requestPasswordReset,
  signOut,
} from './services/auth';

// Re-export other services
export * from './services/clients';
export * from './services/appointments';
export * from './services/assessments';
export * from './services/documents';
export * from './services/calendar';
export * from './services/clinical';
export * from './services/users';

// Hooks
export * from './hooks';

// Utils
export * from './utils/error';
export * from './utils/requestQueue';
export * from './utils/rateLimit';
export * from './utils/subscriptions';
export * from './utils/cache';

// Types
export * from './types';
