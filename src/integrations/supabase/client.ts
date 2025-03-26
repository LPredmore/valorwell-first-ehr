import { createClient } from '@supabase/supabase-js';
import { format, parse } from 'date-fns';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for date handling
export const parseDateString = (dateString: string): Date | null => {
  if (!dateString) return null;
  try {
    return parse(dateString, 'yyyy-MM-dd', new Date());
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

export const formatDateForDB = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// Fix for exported interface CPTCode
export interface CPTCode {
  code: string;
  name: string;
  fee: number;
  description: string;
  clinical_type: string;
}

// Fix for exported interface PracticeInfo
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
}

// Fix for exported functions
export const fetchCPTCodes = async (): Promise<CPTCode[]> => {
  const { data, error } = await supabase
    .from('cpt_codes')
    .select('*');
  
  if (error) {
    console.error('Error fetching CPT codes:', error);
    return [];
  }
  
  return data || [];
};

export const addCPTCode = async (cptCode: CPTCode): Promise<{success: boolean, error?: any}> => {
  const { error } = await supabase
    .from('cpt_codes')
    .insert([cptCode]);
  
  if (error) {
    console.error('Error adding CPT code:', error);
    return { success: false, error };
  }
  
  return { success: true };
};

export const updateCPTCode = async (code: string, cptCode: CPTCode): Promise<{success: boolean, error?: any}> => {
  const { error } = await supabase
    .from('cpt_codes')
    .update(cptCode)
    .eq('code', code);
  
  if (error) {
    console.error('Error updating CPT code:', error);
    return { success: false, error };
  }
  
  return { success: true };
};

export const deleteCPTCode = async (code: string): Promise<{success: boolean, error?: any}> => {
  const { error } = await supabase
    .from('cpt_codes')
    .delete()
    .eq('code', code);
  
  if (error) {
    console.error('Error deleting CPT code:', error);
    return { success: false, error };
  }
  
  return { success: true };
};

export const fetchPracticeInfo = async (): Promise<PracticeInfo | null> => {
  const { data, error } = await supabase
    .from('practice_info')
    .select('*')
    .single();
  
  if (error) {
    console.error('Error fetching practice info:', error);
    return null;
  }
  
  return data;
};

export const updatePracticeInfo = async (info: PracticeInfo): Promise<{success: boolean, error?: any}> => {
  const { error } = await supabase
    .from('practice_info')
    .update(info)
    .eq('id', info.id);
  
  if (error) {
    console.error('Error updating practice info:', error);
    return { success: false, error };
  }
  
  return { success: true };
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  
  return data?.user || null;
};

export const getClinicianIdByName = async (firstName: string, lastName: string) => {
  const { data, error } = await supabase
    .from('clinicians')
    .select('id')
    .eq('clinician_first_name', firstName)
    .eq('clinician_last_name', lastName)
    .single();
  
  if (error) {
    console.error('Error getting clinician ID by name:', error);
    return null;
  }
  
  return data?.id || null;
};

export const getClientByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error getting client by user ID:', error);
    return null;
  }
  
  return data;
};

export const updateClientProfile = async (clientId: string, profileData: any) => {
  const { error } = await supabase
    .from('clients')
    .update(profileData)
    .eq('id', clientId);
  
  if (error) {
    console.error('Error updating client profile:', error);
    return { success: false, error };
  }
  
  return { success: true };
};

export const getClinicianNameById = async (clinicianId: string) => {
  const { data, error } = await supabase
    .from('clinicians')
    .select('clinician_first_name, clinician_last_name, clinician_professional_name')
    .eq('id', clinicianId)
    .single();
  
  if (error) {
    console.error('Error getting clinician name by ID:', error);
    return null;
  }
  
  return data?.clinician_professional_name || 
    `${data?.clinician_first_name || ''} ${data?.clinician_last_name || ''}`.trim();
};

export const createUser = async (userData: any) => {
  const { data, error } = await supabase.auth.signUp(userData);
  
  if (error) {
    console.error('Error creating user:', error);
    return { success: false, error };
  }
  
  return { success: true, data };
};
