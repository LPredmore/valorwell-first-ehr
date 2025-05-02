
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Initialize Supabase client
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Export a function to get document download URL
export const getDocumentDownloadUrl = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 60);
    
  if (error) {
    throw error;
  }
  
  return data?.signedUrl;
};

// Export the types separately to prevent circular dependencies
export type { Database };

// Export individual types explicitly with renamed interfaces to avoid conflicts
import type { CPTCode as DatabaseCPTCode } from './database.types';
export type { DatabaseCPTCode };
