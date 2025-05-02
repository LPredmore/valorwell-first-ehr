
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
