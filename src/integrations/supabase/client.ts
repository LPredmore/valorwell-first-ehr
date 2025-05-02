
// If this file doesn't exist, we'll need to create it with the correct interfaces
import { createClient } from '@supabase/supabase-js';
import { CPTCode } from '@/types/billing';

// Create a single supabase client for interacting with the database
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export interface PracticeInfo {
  id: string;
  practice_name: string;
  practice_npi: string;
  practice_taxid: string;
  practice_taxonomy: string;
  practice_address1: string;
  practice_address2: string;
  practice_city: string;
  practice_state: string;
  practice_zip: string;
  created_at?: string;
  updated_at?: string;
}

// Helper functions for formatting dates
export const parseDateString = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  try {
    return new Date(dateString);
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

export const formatDateForDB = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// User and client functions
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return data.user;
};

export const getClientByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error getting client profile:', error);
    return null;
  }
  
  return data;
};

export const updateClientProfile = async (userId: string, profile: any) => {
  const { data, error } = await supabase
    .from('clients')
    .update(profile)
    .eq('id', userId);
  
  return { data, error };
};

// Document functions
export const fetchClinicalDocuments = async (clientId: string) => {
  const { data, error } = await supabase
    .from('clinical_documents')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching clinical documents:', error);
    throw error;
  }
  
  return data;
};

export const getDocumentDownloadURL = async (filePath: string) => {
  const { data, error } = await supabase
    .storage
    .from('documents')
    .createSignedUrl(filePath, 60);
  
  if (error) {
    console.error('Error getting document download URL:', error);
    throw error;
  }
  
  return data.signedUrl;
};

// Video conferencing
export const getOrCreateVideoRoom = async (appointmentId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-daily-room', {
      body: { appointmentId }
    });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating video room:', error);
    throw error;
  }
};

export const fetchPracticeInfo = async (): Promise<PracticeInfo | null> => {
  const { data, error } = await supabase
    .from('practiceinfo')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching practice info:', error);
    return null;
  }

  return data as PracticeInfo;
};

export const updatePracticeInfo = async (practiceInfo: PracticeInfo): Promise<{success: boolean, error?: any}> => {
  const { data, error } = await supabase
    .from('practiceinfo')
    .upsert(practiceInfo)
    .select();

  return {
    success: !error,
    error,
  };
};

export const fetchCPTCodes = async (): Promise<CPTCode[]> => {
  const { data, error } = await supabase
    .from('cpt_codes')
    .select('*')
    .order('code');

  if (error) {
    console.error('Error fetching CPT codes:', error);
    throw error;
  }

  return data as CPTCode[];
};

export const addCPTCode = async (cptCode: CPTCode): Promise<{success: boolean, error?: any}> => {
  const { data, error } = await supabase
    .from('cpt_codes')
    .insert(cptCode)
    .select();

  return {
    success: !error,
    error,
  };
};

export const updateCPTCode = async (code: string, cptCode: CPTCode): Promise<{success: boolean, error?: any}> => {
  const { data, error } = await supabase
    .from('cpt_codes')
    .update(cptCode)
    .eq('code', code)
    .select();

  return {
    success: !error,
    error,
  };
};

export const deleteCPTCode = async (code: string): Promise<{success: boolean, error?: any}> => {
  const { data, error } = await supabase
    .from('cpt_codes')
    .delete()
    .eq('code', code);

  return {
    success: !error,
    error,
  };
};

// Export CPTCode interface for use in other files
export interface CPTCode {
  code: string;
  name: string;
  description?: string;
  fee: number;
  clinical_type?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
