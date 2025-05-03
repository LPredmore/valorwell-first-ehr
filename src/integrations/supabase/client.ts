
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

// Function to parse date string to Date object
export const parseDateString = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  return new Date(dateString);
};

// Function to format Date object for DB
export const formatDateForDB = (date: Date | null): string | null => {
  if (!date) return null;
  return date.toISOString().split('T')[0];
};

// Function to get the current authenticated user
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  return data.user;
};

// Function to create or get a video room for an appointment
export const getOrCreateVideoRoom = async (appointmentId: string) => {
  // This would typically call a Supabase Edge function
  // For now, returning a mock room URL
  return `https://meet.valorwell.org/room/${appointmentId}`;
};

// CPT Codes functions
export const fetchCPTCodes = async () => {
  const { data, error } = await supabase
    .from('cpt_codes')
    .select('*')
    .order('code');
    
  if (error) {
    throw error;
  }
  
  return data;
};

export const addCPTCode = async (code: Omit<CPTCode, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('cpt_codes')
    .insert([code])
    .select();
    
  if (error) {
    throw error;
  }
  
  return data[0];
};

export const updateCPTCode = async (id: number, updates: Partial<Omit<CPTCode, 'id' | 'created_at' | 'updated_at'>>) => {
  const { data, error } = await supabase
    .from('cpt_codes')
    .update(updates)
    .eq('id', id)
    .select();
    
  if (error) {
    throw error;
  }
  
  return data[0];
};

export const deleteCPTCode = async (id: number) => {
  const { error } = await supabase
    .from('cpt_codes')
    .delete()
    .eq('id', id);
    
  if (error) {
    throw error;
  }
  
  return true;
};

// Practice Info functions
export const fetchPracticeInfo = async () => {
  const { data, error } = await supabase
    .from('practiceinfo')
    .select('*')
    .maybeSingle();
    
  if (error) {
    throw error;
  }
  
  return data;
};

export const updatePracticeInfo = async (updates: Partial<Omit<PracticeInfo, 'id' | 'created_at' | 'updated_at'>>) => {
  // First check if there's an existing record
  const { data: existing } = await supabase
    .from('practiceinfo')
    .select('id')
    .maybeSingle();
    
  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from('practiceinfo')
      .update(updates)
      .eq('id', existing.id)
      .select();
      
    if (error) {
      throw error;
    }
    
    return data[0];
  } else {
    // Create new record
    const { data, error } = await supabase
      .from('practiceinfo')
      .insert([updates])
      .select();
      
    if (error) {
      throw error;
    }
    
    return data[0];
  }
};

// Export the types separately to prevent circular dependencies
export type { Database };

// Export individual types explicitly with renamed interfaces to avoid conflicts
import type { CPTCode, PracticeInfo } from './database.types';
export type { CPTCode, PracticeInfo };
